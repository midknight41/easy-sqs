import AWS = require("aws-sdk");
import errors = require("./CustomErrors");
import events = require("events");

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

export class QueueReader extends events.EventEmitter implements IQueueReader {
  public receiptCallback: (err: Error, messages: AWS.Sqs.Message[], context: IMessageDeleter) => void;
  public emptyCallback: (err: Error) => void;
  public errorHandler: (err: Error) => void;
  private sqs: AWS.SQS;
  private queueName: string;
  public batchSize: number;
  private listening: boolean = false;
  private stopping: boolean = false;
  private deleter: MessageDeleter;
  private init: boolean;

  constructor(sqs: AWS.SQS, queueName: string, batchSize?: number) {
    super();

    if (queueName == null) throw new errors.NullOrEmptyArgumentError("queueName");
    if (queueName.length == 0) throw new errors.InvalidArgumentError("queueName cannot be an empty string");
    if (sqs == null) throw new errors.NullOrEmptyArgumentError("sqs");
    if (batchSize == null) batchSize = 10;
    if (batchSize <= 0) throw new errors.InvalidArgumentError("batchSize must be a positive number");

    this.sqs = sqs;
    this.queueName = queueName;
    this.batchSize = batchSize;
    this.init = false;
  }

  //Legacy API
  public onReceipt(callback: (err: Error, messages: AWS.Sqs.Message[], context: IMessageDeleter) => void): IQueueReader {
    console.info("onReceipt is deprecated. Use on(\"message\") instead. See README.md for usage.");
    this.receiptCallback = callback;
    return this;
  }

  public onEmpty(callback: (err: Error) => void): IQueueReader {
    console.info("onEmpty is deprecated. Use on(\"empty\") instead. See README.md for usage.");
    this.emptyCallback = callback;
    return this;
  }

  public onError(callback: (err: Error) => void): IQueueReader {
    console.info("onError is deprecated. Use on(\"error\") instead. See README.md for usage.");
    this.errorHandler = callback;
    return this;
  }

  public start() {

    var me = this;

    this.checkEventsAreSetupCorrectly();

    if (this.deleter == null) {
      this.deleter = new MessageDeleter(me.sqs, me.queueName, me.batchSize, me.errorHandler);
    }

    me.listening = true;

    process.nextTick(function () {
      me.internalMonitorQueue(me.deleter);
    });
  }

  private checkEventsAreSetupCorrectly() {

    this.receiptCallback = this.receiptCallback != null ? this.receiptCallback : function (err: Error, messages, context) { };
    this.errorHandler = this.errorHandler != null ? this.errorHandler : function (err: Error) { };

    //not needed in all implementations
    this.emptyCallback = this.emptyCallback != null ? this.emptyCallback : function (err: Error) { };
  }

  //stop will emit a stopped event which can be used to shut down a queue reader
  //pause will stop reading, but it will not emit the stopped event. This is aid
  //piping with the MessageStream class

  public stop() {
    this.listening = false;
    this.stopping = true;
  }

  public pause() {
    this.listening = false;
  }

  private internalMonitorQueue(deleter: MessageDeleter) {

    var client = this.sqs;
    var me = this;

    var params = {
      MaxNumberOfMessages: me.batchSize,
      QueueUrl: me.queueName
    };

    //ensure we aren't holding any outstanding delete requests
    //TODO: Should this safety check be moved to a timer on deleter?
    deleter.flushReceiptLog();

    //abort after cleaning up
    if (me.listening == false) {
      if (me.stopping = true) {
        me.stopping = false;
        me.emit("stopped");
      }
      return;
    }
    client.receiveMessage(params, function (err, data) {

      if (err != null) {
        me.emit("error", err);
        me.errorHandler(err); //To be deprecated
        deleter.flushReceiptLog();
        return;
      }

      if (data.Messages != null) {

        data.Messages.forEach((message) => {
          me.emit("message", message, deleter);
        });
        me.receiptCallback(err, data.Messages, deleter); //To be deprecated
        me.internalMonitorQueue(deleter);

      } else {
        me.emit("empty", err);
        me.emptyCallback(err); //To be deprecated
        deleter.flushReceiptLog();
        me.internalMonitorQueue(deleter);

      }

    });

  }

  //IMessageDeleter
  public deleteMessage(message: AWS.Sqs.Message) {
    this.deleter.deleteMessage(message);
  }

  public deleteMessages(messages: AWS.Sqs.Message[]) {
    this.deleter.deleteMessages(messages);
  }

  public flushReceiptLog() {
    this.deleter.flushReceiptLog();
  }


}

export class MessageDeleter extends events.EventEmitter implements IMessageDeleter {

  private receiptLog = [];
  private threshold: number;
  private queueName: string;
  private sqs: AWS.SQS;
  private errorHandler: (err: Error) => void;

  //This signature should be changed to drop errorHandler in favour of on("error")
  constructor(sqs: AWS.SQS, queueName: string, batchSize: number, errorHandler: (err: Error) => void) {
    super();

    if (queueName == null || queueName.length == 0) throw new Error("queueName was not provided");
    if (sqs == null) throw new Error("sqs was not provided");

    //swallow errors if null
    this.errorHandler = errorHandler != null ? errorHandler : function (err: Error) { };

    this.sqs = sqs;
    this.threshold = batchSize > 0 ? batchSize : 1;
    this.queueName = queueName;

  }

  public deleteMessage(message: AWS.Sqs.Message) {

    this.receiptLog.push(message);
    this.flushIfThresholdExceeded();
  }

  public deleteMessages(messages: AWS.Sqs.Message[]) {

    var me = this;

    messages.forEach(function (value, index, array) {
      me.receiptLog.push(value);
    });

    me.flushIfThresholdExceeded();
  }

  private flushIfThresholdExceeded() {
    if (this.receiptLog.length >= this.threshold) {
      this.flushReceiptLog();
    }
  }
  public flushReceiptLog() {

    if (this.receiptLog.length > 0) {
      this.cleanUp(this.sqs, this);
    }
  }

  private cleanUp(client, parent: MessageDeleter) {

    var i = 0;
    var list: string[] = [];

    parent.receiptLog.forEach(function (msg: AWS.Sqs.Message, index, array) {

      list.push(msg.ReceiptHandle);

      i++;

      if (i == parent.threshold || index == array.length - 1) {

        parent.deleteMessageBatch(client, parent.queueName, list);

        list = new Array<string>();
        i = 0;
      }

      if (index == array.length - 1) {
        parent.receiptLog = [];
      }

    });
  }

  private deleteMessageBatch(client: AWS.Sqs.Client, queueName: string, handles: string[]) {

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

      if (err) {
        me.emit("error", err);
        me.errorHandler(err);
      }
    });

  }

}

var flushCount = 0;
