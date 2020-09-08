import { Connection, Channel } from 'amqplib';

interface IMessage {
  publishedAt: Date;
}
interface IHandler<T> {
  handle(message: T): any;
}
interface IRabbitServer<T extends IMessage> {
  getConnection(): Promise<Connection>;
  start(): void;
  produce<T>(queue: string, message: T): Promise<boolean>;
  subscribe(queue: string, onMessage: (msg: T | null) => boolean): void;
  subscribeWithHandler(queue: string, hander: IHandler<T>): void;
}
declare class RabbitServer implements IRabbitServer<IMessage> {
  private constructor();
  private listeners(): Promise<Connection>;
  private close(): void;
  private initChannel(queue: string): Promise<Channel>;
  public static getInstance(): RabbitServer;
  public getConnection(): Promise<Connection>;
  public start(): void;
  public produce<T>(queue: string, message: T): Promise<boolean>;
  public subscribe(queue: string, onMessage: (msg: IMessage) => boolean): void;
  public subscribeWithHandler(queue: string, hander: IHandler<IMessage>): void;
}
export default RabbitServer;
