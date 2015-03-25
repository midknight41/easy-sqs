import AWS = require("aws-sdk");
import events = require("events");

export interface IQueue {
  queueName: string;
  getMessage(callback: (err: Error, data: AWS.Sqs.Message) => void);
  deleteMessage(msg: AWS.Sqs.Message, callback: (err: Error) => void);
  sendMessage(data: string, callback: (err: Error) => void);
  createQueueReader(): IQueueReader;
  drain(callback?: (err: Error) => void);
}

export interface IQueueReader extends events.EventEmitter, IMessageDeleter {
  onReceipt(callback: (err, messages: AWS.Sqs.Message[], context: IMessageDeleter) => void);
  onEmpty(callback: (err) => void);
  start();
  stop();
  pause();
  receiptCallback: (err: Error, messages: AWS.Sqs.Message[], context: IMessageDeleter) => void;
  emptyCallback: (err: Error) => void;
  errorHandler: (err: Error) => void;
}

export interface IMessageDeleter {
  deleteMessage(message: AWS.Sqs.Message);
  deleteMessages(messages: AWS.Sqs.Message[]);
  flushReceiptLog();
}

export interface IMessageStream {
  _read(size?: number);
  close();
}

export interface IMessageStreamOptions {
  highWaterMark?: number;
  closeOnEmpty?: boolean;
}

