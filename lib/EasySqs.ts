import AWS = require("aws-sdk");
import reader = require("./EasyQueueReader");
import errors = require("./CustomErrors");
import stream = require("./MessageStream");

export interface IQueue {
  queueName: string;
  getMessage(callback: (err: Error, data: AWS.Sqs.Message) => void);
  deleteMessage(msg: AWS.Sqs.Message, callback: (err: Error) => void);
  sendMessage(data: string, callback: (err: Error) => void);
  createQueueReader(): reader.IQueueReader;
  drain(callback?: (err: Error) => void);
}

export class Queue implements IQueue {

  public queueName: string;
  private sqs: AWS.SQS;

  constructor(queueName: string, sqs: AWS.SQS) {

    if (queueName == null) throw new errors.NullOrEmptyArgumentError("queueName");
    if (queueName.length == 0) throw new errors.InvalidArgumentError("queueName not provided");
    if (sqs == null) throw new errors.NullOrEmptyArgumentError("sqs");

    this.queueName = queueName;
    this.sqs = sqs;

  }

  public createBatchDeleter(batchSize?: number) {
    return new reader.MessageDeleter(this.sqs, this.queueName, batchSize, null);
  }

  public createQueueReader(batchSize?: number): reader.IQueueReader {
    return new reader.QueueReader(this.sqs, this.queueName, batchSize);
  }

  public createMessageStream(highWaterMark?: number, batchSize?:number): stream.IMessageStream {
    var rdr = new reader.QueueReader(this.sqs, this.queueName, batchSize);

    var opts: stream.IMessageStreamOptions = null;

    if (highWaterMark != null) {
      opts = {
        highWaterMark: highWaterMark
      };
    }
    
    return new stream.MessageStream(rdr, opts);
  }

  public drain(callback?: (err: Error) => void) {

    var queue = this;

    var queueReader = queue.createQueueReader();

    queueReader
      .onReceipt(function readMessages(err, data, context) {

        if (data != null) {

          data.forEach(function (value, i, list) {
            context.deleteMessage(value);
          });
        }
      })
      .onEmpty(function (err) {
        //all done, stop monitoring the queue
        queueReader.stop();

        if (callback != null) {
          callback(err);
        }

      }, true)
      .start();
  }

  getMessage(callback: (err: Error, data: AWS.Sqs.Message) => void) {

    var client = this.sqs;
    var params: AWS.Sqs.ReceiveMessageRequest = {};

    params.QueueUrl = this.queueName,
    params.MaxNumberOfMessages = 1;

    client.receiveMessage(params, function (err: Error, data: AWS.Sqs.ReceiveMessageResult) {

      if (data.Messages != null && data.Messages.length > 0) {

        var msg = data.Messages[0];
        callback(err, msg);

      }
    });

  }

  deleteMessage(msg: AWS.Sqs.Message, callback: (err: Error) => void) {
    var client = this.sqs;
    var params: AWS.Sqs.DeleteMessageRequest = {};

    if (msg == null) {
      callback(new errors.NullOrEmptyArgumentError("msg"));
      return;
    }

    if (msg.ReceiptHandle == null || msg.ReceiptHandle.length == 0) {
      callback(new errors.InvalidArgumentError("msg.ReceiptHandle cannot be null or empty")); return;
    }

    params.QueueUrl = this.queueName,
    params.ReceiptHandle = msg.ReceiptHandle;

    client.deleteMessage(params, function (err: Error, data: any) {
      callback(err);
    });
  }

  sendMessage(data: string, callback: (err: Error) => void) {
    var client = this.sqs;

    if (data == null) { callback(new errors.NullOrEmptyArgumentError("Data cannot be null")); return; }
    if (data.length > 262144) { callback(new errors.InvalidArgumentError("data too large for SQS")); return; }

    var params: AWS.Sqs.SendMessageRequest = {};

    params.QueueUrl = this.queueName;
    params.MessageBody = data;

    client.sendMessage(params, function (err, data) {

      callback(err);
    });

  }
}
