import AWS = require("aws-sdk");
import errors = require("./CustomErrors");
import events = require("events");
import interfaces = require("./Interfaces");
import md = require("./MessageDeleter");

export class QueueReader extends events.EventEmitter implements interfaces.IQueueReader {
  public receiptCallback: (err: Error, messages: AWS.Sqs.Message[], context: interfaces.IMessageDeleter) => void;
  public emptyCallback: (err: Error) => void;
  public errorHandler: (err: Error) => void;
  private sqs: AWS.SQS;
  private queueName: string;
  public batchSize: number;
  private listening: boolean = false;
  private stopping: boolean = false;
  private deleter: interfaces.IMessageDeleter;
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
  public onReceipt(callback: (err: Error, messages: AWS.Sqs.Message[], context: interfaces.IMessageDeleter) => void): interfaces.IQueueReader {
    console.info("onReceipt is deprecated. Use on(\"message\") instead. See README.md for usage.");
    this.receiptCallback = callback;
    return this;
  }

  public onEmpty(callback: (err: Error) => void): interfaces.IQueueReader {
    console.info("onEmpty is deprecated. Use on(\"empty\") instead. See README.md for usage.");
    this.emptyCallback = callback;
    return this;
  }

  public onError(callback: (err: Error) => void): interfaces.IQueueReader {
    console.info("onError is deprecated. Use on(\"error\") instead. See README.md for usage.");
    this.errorHandler = callback;
    return this;
  }

  public start() {

    var me = this;

    this.checkEventsAreSetupCorrectly();

    if (this.deleter == null) {
      this.deleter = new md.MessageDeleter(me.sqs, me.queueName, me.batchSize, me.errorHandler);
    }

    me.listening = true;

    process.nextTick(function () {
      me.emit("started");
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

  private internalMonitorQueue(deleter: interfaces.IMessageDeleter) {

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
      if (me.stopping == true) {
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
