import { Connection, Channel, connect } from 'amqplib';
import { Logger } from '../utils/logger';
import { sleep } from '../utils/sleep';
import { retry } from 'utils/retry';
export interface IMessage {
  publishedAt: Date;
}
export interface IHandler<T> {
  handle(message: T): any;
}
export interface IRabbitServer<T extends IMessage> {
  getConnection(): Promise<Connection>;
  produce<T>(queue: string, message: T): Promise<boolean>;
  subscribe(queue: string, onMessage: (msg: T | null) => boolean): void;
  subscribeWithHandler(queue: string, hander: IHandler<T>): void;
}

export class RabbitServer implements IRabbitServer<IMessage> {
  private static _instance: RabbitServer;
  private rabbitUrl: string;
  private connection: Connection;
  private channel: Channel;
  private constructor() {
    if (process.env.RABBIT_HOST) this.rabbitUrl = process.env.RABBIT_HOST;
  }
  public static getInstance = (): RabbitServer => {
    if (!RabbitServer._instance) RabbitServer._instance = new RabbitServer();
    return RabbitServer._instance;
  };
  public setRabbitUrl = (url: string) => {
    if (!url || this.rabbitUrl) return;
    this.rabbitUrl = url;
  };
  public getConnection(): Promise<Connection> {
    return new Promise((resolve, reject) => {
      resolve(this.connection);
      reject('No Connection established');
    });
  }
  public start = async () => {
    return new Promise<Connection>((resolve, reject) => {
      if (this.connection || !this.rabbitUrl) {
        const message = !this.rabbitUrl
          ? 'The host of rabbitmq was not found in the environment variables'
          : 'Connection has already been established';
        Logger.info(message);
        reject(new Error(message));
      }
      retry<Connection>(() => connect(this.rabbitUrl), 10, 1000)
        .then((conn) => {
          this.connection = conn;
          resolve(conn);
        })
        .catch((err) => reject(new Error(err)));
    });
    // if (this.connection || !this.rabbitUrl) {
    //   const message = !this.rabbitUrl
    //     ? 'The host of rabbitmq was not found in the environment variables'
    //     : 'Connection has already been established';
    //   throw new Error(message);
    // }
    // this.connection = await retry<Connection>(
    //   () => connect(this.rabbitUrl),
    //   10,
    //   1000
    // ).then((connection) => {
    //   Logger.info('connect to RabbitMQ success');
    //   return this.listeners();
    // });
  };
  // public start = async () => {
  //   try {
  //     if (this.connection) {
  //       Logger.info('Connection has already been established');
  //       throw new Error('Connection has already been established');
  //     }
  //     this.connection = await connect(this.rabbitUrl).then((connection) => {
  //       Logger.info('connect to RabbitMQ success');
  //       return this.listeners();
  //     });
  //   } catch (err) {
  //     Logger.info(err.message);
  //     sleep(this.start, 10000);
  //   }
  // };
  private listeners = (): Promise<Connection> => {
    return new Promise((resolve, reject) => {
      if (!this.connection) {
        this.rabbitUrl ? this.start() : reject();
        reject();
      }
      resolve(
        this.connection.on('error', (err: Error) => {
          Logger.info(err.message);
          sleep(this.start, 10000);
        }) &&
          this.connection.on('close', (err: Error) => {
            if (err) {
              Logger.info('connection closed because err!');
              sleep(this.start, 10000);
            }
            Logger.info('connection to RabbitQM closed!');
          })
      );
    });
  };
  private close = async () => {
    if (this.channel) await this.channel.close();
    await this.connection.close();
  };
  private initChannel = async (queue: string) => {
    this.channel = await this.connection.createChannel();
    await this.channel.assertQueue(queue, { durable: true });
    return this.channel;
  };
  public produce = async <T>(queue: string, message: T): Promise<boolean> => {
    try {
      if (!this.connection) await this.start();
      await this.initChannel(queue);
      const sendResult = this.channel.sendToQueue(queue, Buffer.from(message), {
        persistent: true,
      });
      if (!sendResult) {
        await new Promise((resolve) =>
          this.channel.once('drain', () => resolve)
        );
      }
      return sendResult;
    } catch (error) {
      Logger.info(error.message);
      return false;
    }
  };
  public subscribe = async (
    queue: string,
    onMessage: (msg: IMessage) => boolean
  ): Promise<void> => {
    if (!this.connection) await this.start();
    const channel = await this.initChannel(queue);
    channel.consume(queue, (message) => {
      if (!message) return false;
      const body = <IMessage>JSON.parse(message.content.toString());
      if (body && onMessage(body)) onMessage(body);
      channel.ack(message);
    });
  };

  public subscribeWithHandler = (
    queue: string,
    handler: IHandler<IMessage>
  ): void => {
    this.subscribe(queue, handler.handle);
  };
}
