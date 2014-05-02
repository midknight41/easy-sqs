/// <reference path="./imports.d.ts" />

import AWS = require("aws-sdk");
import errors = require("./CustomErrors");

export interface IQueueReader {
  onReceipt(callback: (err, messages: AWS.Sqs.Message[], context: IMessageDeleter) => void);
  onEmpty(callback: (err) => void);
  start();
  stop();
  receiptCallback: (err: Error, messages: AWS.Sqs.Message[], context: IMessageDeleter) => void;
  emptyCallback: (err: Error) => void;
  errorHandler: (err: Error) => void;

}

export interface IMessageDeleter {
  deleteMessage(message: AWS.Sqs.Message);
  deleteMessages(messages: AWS.Sqs.Message[]);
}

export class QueueReader implements IQueueReader {
  public receiptCallback: (err: Error, messages: AWS.Sqs.Message[], context: IMessageDeleter) => void;
  public emptyCallback: (err: Error) => void;
  public errorHandler: (err: Error) => void;
  private sqs: AWS.SQS;
  private queueName: string;
  public batchSize: number;
  private listening: boolean = false;

  constructor(sqs: AWS.SQS, queueName: string, batchSize?: number) {

    if (queueName == null) throw new errors.NullArgumentError("queueName");
    if (queueName.length == 0) throw new errors.InvalidArgumentError("queueName cannot be an empty string");
    if (sqs == null) throw new errors.NullArgumentError("sqs");
    if (batchSize == null) batchSize = 10;
    if (batchSize <= 0) throw new errors.InvalidArgumentError("batchSize must be a positive number");

    this.sqs = sqs;
    this.queueName = queueName;
    this.batchSize = batchSize;
  }

  public onReceipt(callback: (err: Error, messages: AWS.Sqs.Message[], context: IMessageDeleter) => void): IQueueReader {
    this.receiptCallback = callback;
    return this;
  }

  public onEmpty(callback: (err: Error) => void): IQueueReader {
    this.emptyCallback = callback;
    return this;
  }

  public onError(callback: (err: Error) => void): IQueueReader {
    this.errorHandler = callback;
    return this;
  }
  public start() {

    this.checkEventsAreSetupCorrectly();

    var me = this;
    var deleter = new MessageDeleter(me.sqs.client, me.queueName, me.batchSize, me.errorHandler);

    me.listening = true;

    process.nextTick(function () {
      me.internalMonitorQueue(deleter);
    });
  }

  private checkEventsAreSetupCorrectly() {

    if (this.receiptCallback == null) throw new Error("onReceipt() hass not been correctly initialised");

    //if no proper handler is set up then console.log to provide some visibility
    this.errorHandler = this.errorHandler != null ? this.errorHandler : function (err: Error) { console.log("SimpleQueueReader error: ", err); };

    //not needed in all implementations
    this.emptyCallback = this.emptyCallback != null ? this.emptyCallback : function (err: Error) { };
  }

  public stop() {
    this.listening = false;
  }

  private internalMonitorQueue(deleter: MessageDeleter) {

    var client = this.sqs.client;
    var me = this;

    var params = {
      MaxNumberOfMessages: me.batchSize,
      QueueUrl: me.queueName
    };

    //ensure we aren't holding any outstanding delete requests
    deleter.flush();

    //abort after cleaning up
    if (me.listening == false) return;
    //else console.log("listening");

    client.receiveMessage(params, function (err, data) {

      if (err != null) {
        console.log("error receiving message:" + err);
        me.errorHandler(err);
        deleter.flush();
        return;
      }

      if (data.Messages != null) {

        //console.log("got messages");
        me.receiptCallback(err, data.Messages, deleter);
        me.internalMonitorQueue(deleter);

      } else {
        me.emptyCallback(err);
        me.internalMonitorQueue(deleter);

      }

    });

  }

}

//can this all be replaced with async.cargo?

export class MessageDeleter implements IMessageDeleter {

  private recieptLog = [];
  private threshold: number;
  private queueName: string;
  private client: AWS.Sqs.Client;
  private errorHandler: (err: Error) => void;

  constructor(client: AWS.Sqs.Client, queueName: string, batchSize: number, errorHandler: (err: Error) => void) {

    if (queueName == null || queueName.length == 0) throw new Error("queueName was not provided");
    if (client == null) throw new Error("sqs was not provided");

    //swallow errors if null
    this.errorHandler = errorHandler != null ? errorHandler : function (err: Error) { };

    this.client = client;
    this.threshold = batchSize > 0 ? batchSize : 1;
    this.queueName = queueName;

  }

  public deleteMessage(message: AWS.Sqs.Message) {

    this.recieptLog.push(message);
    this.flushIfThresholdExceeded();
  }

  public deleteMessages(messages: AWS.Sqs.Message[]) {

    var me = this;

    messages.forEach(function (value, index, array) {
      me.recieptLog.push(value);
    });

    //console.log("log", this.recieptLog.length);

    me.flushIfThresholdExceeded();
  }

  private flushIfThresholdExceeded() {
    if (this.recieptLog.length >= this.threshold) {
      this.flush();
    }
  }
  public flush() {

    if (this.recieptLog.length > 0) {
      //console.log("flushing!");
      this.cleanUp(this.client, this);
    }
  }

  private cleanUp(client, parent: MessageDeleter) {

    var i = 0;
    var list: string[] = [];

    parent.recieptLog.forEach(function (msg: AWS.Sqs.Message, index, array) {

      list.push(msg.ReceiptHandle);

      i++;

      if (i == parent.threshold || index == array.length - 1) {

        parent.deleteMessageBatch(client, parent.queueName, list);

        list = new Array<string>();
        i = 0;
      }

      if (index == array.length - 1) {
        parent.recieptLog = [];
      }

    });
  }

  private deleteMessageBatch(client: AWS.Sqs.Client, queueName: string, handles: string[]) {

    //console.log("preparing batch", handles.length);

    var entries: AWS.Sqs.DeleteMessageBatchRequestEntry[] = [];
    var me = this;

    for (var i = 0; i < handles.length; i++) {

      var entry: AWS.Sqs.DeleteMessageBatchRequestEntry = {
        Id: i.toString(),
        ReceiptHandle: handles[i]
      };

      entries.push(entry);
    }

    var params: AWS.Sqs.DeleteMessageBatchRequest = {
      QueueUrl: queueName,
      Entries: entries
    };

    client.deleteMessageBatch(params, function (err, data) {
      if (err != null) me.errorHandler(err);
    });

  }

}