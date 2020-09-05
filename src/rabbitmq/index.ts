// import { Channel, Connection, connect } from 'amqplib';
// import { sleep } from 'utils/sleep';
// import { Logger } from 'utils/logger';
// interface IArgs {
//   operation: () => any;
//   maxAttempts: number;
//   waitTimeMSeconds: number;
// }
// export class RabbitMQServer {
//   private rabbitUrl: string;
//   private connection: Connection;
//   private channel: Channel;
//   constructor() {}
//   getConnection = () => {
//     return this.connection;
//   };
//   getChannel = () => {
//     return this.channel;
//   };
//   private listeners = async (): Promise<Connection> => {
//     return (
//       this.connection.on('error', (err: Error) => {
//         Logger.info(err.message);
//         sleep(this.start, 10000);
//       }) &&
//       this.connection.on('close', () => {
//         Logger.info('connection to RabbitQM closed!');
//         sleep(this.start, 10000);
//       })
//     );
//   };
//   private start = async () => {
//     try {
//       this.connection = await connect(this.rabbitUrl);
//       Logger.info('connect to RabbitMQ success');
//       await this.listeners();
//     } catch (err) {
//       Logger.info(err.message);
//       sleep(this.start, 10000);
//     }
//   };
//   private close = async () => {
//     if (this.channel) await this.channel.close();
//     await this.connection.close();
//   };
//   private initChannel = async (queue: string) => {
//     this.channel = await this.connection.createChannel();
//     await this.channel.assertQueue(queue, { durable: true });
//   };
//   publishInQueue = async (queue: string, message: string) => {
//     try {
//       if (!this.connection) await this.start();
//       await this.initChannel(queue);
//       const sendResult = this.channel.sendToQueue(queue, Buffer.from(message), {
//         persistent: true,
//       });
//       if (!sendResult) {
//         await new Promise(resolve => this.channel.once('drain', () => resolve));
//       }
//       return sendResult;
//     } catch (error) {
//       Logger.info(error.message);
//     } finally {
//       this.close();
//     }
//   };
//   subscribeInQueue = async (
//     queue: string,
//     onMessage: (msg: T | null) => boolean,
//   ) => {
//     if (!this.connection) await this.start();
//     if (!this.channel) await this.initChannel(queue);
//     this.channel.consume(queue, message => {
//       if (message) {
//         const body = <T>JSON.parse(message.content.toString());
//         if (body && onMessage(body)) {
//           channel.ack(message);
//         }
//       }
//     });
//   };
//   // subscribeInQueue = async (
//   //   queue: string,
//   //   onMessage: (msg: string | null) => boolean,
//   // ) => {
//   //   await this.channel.assertQueue(queue, { durable: true });
//   //   this.channel.consume(queue, message => {
//   //     if (message) {
//   //       const body = <T>JSON.parse(message.content.toString());
//   //       if (body && onMessage(body)) {
//   //         this.channel.ack(message);
//   //       }
//   //     }
//   //   });
//   // };
// }
