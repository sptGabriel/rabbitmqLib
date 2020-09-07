import { IHandler, IMessage, IRabbitServer } from '../src/broker/index';
import { Connection } from 'amqplib';

export declare abstract class RabbitServer implements IRabbitServer<IMessage> {
  getConnection(): Connection;
  produce<T>(queue: string, message: T): Promise<boolean>;
  subscribe(queue: string, onMessage: (msg: any) => boolean): void;
  subscribeWithHandler(queue: string, hander: IHandler<any>): void;
}
export default RabbitServer;
