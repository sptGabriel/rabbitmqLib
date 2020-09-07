"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RabbitServer = void 0;
const amqplib_1 = require("amqplib");
const logger_1 = require("../utils/logger");
const sleep_1 = require("../utils/sleep");
class RabbitServer {
    constructor() {
        this.start = async () => {
            try {
                this.connection = await amqplib_1.connect(this.rabbitUrl).then((connection) => {
                    logger_1.Logger.info('connect to RabbitMQ success');
                    return (this.connection.on('error', (err) => {
                        logger_1.Logger.info(err.message);
                        sleep_1.sleep(this.start, 10000);
                    }) &&
                        this.connection.on('close', () => {
                            logger_1.Logger.info('connection to RabbitQM closed!');
                            sleep_1.sleep(this.start, 10000);
                        }));
                });
            }
            catch (err) {
                logger_1.Logger.info(err.message);
                sleep_1.sleep(this.start, 10000);
            }
        };
        this.close = async () => {
            if (this.channel)
                await this.channel.close();
            await this.connection.close();
        };
        this.initChannel = async (queue) => {
            this.channel = await this.connection.createChannel();
            await this.channel.assertQueue(queue, { durable: true });
            return this.channel;
        };
        this.produce = async (queue, message) => {
            try {
                if (!this.connection)
                    await this.start();
                await this.initChannel(queue);
                const sendResult = this.channel.sendToQueue(queue, Buffer.from(message), {
                    persistent: true,
                });
                if (!sendResult) {
                    await new Promise((resolve) => this.channel.once('drain', () => resolve));
                }
                return sendResult;
            }
            catch (error) {
                logger_1.Logger.info(error.message);
                return false;
            }
        };
        this.subscribe = async (queue, onMessage) => {
            if (!this.connection)
                await this.start();
            const channel = await this.initChannel(queue);
            channel.consume(queue, (message) => {
                if (!message)
                    return false;
                const body = JSON.parse(message.content.toString());
                if (body && onMessage(body))
                    onMessage(body);
                channel.ack(message);
            });
        };
        this.subscribeWithHandler = (queue, handler) => {
            this.subscribe(queue, handler.handle);
        };
    }
    getConnection() {
        return this.connection;
    }
}
exports.RabbitServer = RabbitServer;
RabbitServer.getInstance = async () => {
    if (!RabbitServer._instance)
        RabbitServer._instance = new RabbitServer();
    return RabbitServer._instance;
};
