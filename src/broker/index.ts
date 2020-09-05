import { Connection, Channel, connect } from 'amqplib';
import { Logger } from 'utils/logger';
import { sleep } from 'utils/sleep';
export interface IMessage {
  publishedAt: Date;
}
export interface IHandler<T> {
  handle(message: T): any;
}
export interface IRabbitServer<T extends IMessage> {
  getConnection(): Connection;
  produce<T>(queue: string, message: T): Promise<boolean>;
  subscribe(queue: string, onMessage: (msg: T | null) => boolean): void;
  subscribeWithHandler(queue: string, hander: IHandler<T>): void;
}
export class RabbitServer implements IRabbitServer<IMessage> {
  private static instance: RabbitServer;
  private rabbitUrl: string;
  private connection: Connection;
  private channel: Channel;
  private constructor(rabbitUrl: string) {
    this.rabbitUrl = rabbitUrl;
  }
  getConnection(): Connection {
    return this.connection;
  }
  static getInstance(rabbitUrl: string): RabbitServer {
    if (!RabbitServer.instance) {
      RabbitServer.instance = new RabbitServer(rabbitUrl);
    }

    return RabbitServer.instance;
  }
  private start = async () => {
    try {
      this.connection = await connect(this.rabbitUrl);
      Logger.info('connect to RabbitMQ success');
      await this.listeners();
    } catch (err) {
      Logger.info(err.message);
      sleep(this.start, 10000);
    }
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

  private listeners = async (): Promise<Connection> => {
    return (
      this.connection.on('error', (err: Error) => {
        Logger.info(err.message);
        sleep(this.start, 10000);
      }) &&
      this.connection.on('close', () => {
        Logger.info('connection to RabbitQM closed!');
        sleep(this.start, 10000);
      })
    );
  };
  public produce = async <T>(queue: string, message: T): Promise<boolean> => {
    try {
      if (!this.connection) await this.start();
      await this.initChannel(queue);
      const sendResult = this.channel.sendToQueue(queue, Buffer.from(message), {
        persistent: true,
      });
      if (!sendResult) {
        await new Promise(resolve => this.channel.once('drain', () => resolve));
      }
      return sendResult;
    } catch (error) {
      Logger.info(error.message);
      return false;
    } finally {
      this.close();
    }
  };
  public subscribe = async (
    queue: string,
    onMessage: (msg: IMessage) => boolean,
  ): Promise<void> => {
    if (!this.connection) await this.start();
    const channel = await this.initChannel(queue);
    channel.consume(queue, message => {
      if (!message) return false;
      const body = <IMessage>JSON.parse(message.content.toString());
      if (body && onMessage(body)) onMessage(body);
      channel.ack(message);
    });
  };

  public subscribeWithHandler = (
    queue: string,
    handler: IHandler<IMessage>,
  ): void => {
    this.subscribe(queue, handler.handle);
  };
}
