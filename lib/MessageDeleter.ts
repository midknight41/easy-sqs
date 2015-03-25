import AWS = require("aws-sdk");
import errors = require("./CustomErrors");
import events = require("events");
import interfaces = require("./Interfaces");

export class MessageDeleter extends events.EventEmitter implements interfaces.IMessageDeleter {

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
