import events = require("events");
import streams = require("stream");
import AWS = require("aws-sdk");
import errors = require("./CustomErrors");
import interfaces = require("./Interfaces");


export class MessageStream extends streams.Readable implements interfaces.IMessageStream, interfaces.IMessageDeleter {

  private reader: interfaces.IQueueReader;
  public closeOnEmpty: boolean;
  public highWaterMark: number;
  private started: boolean;

  constructor(reader: interfaces.IQueueReader, options?: interfaces.IMessageStreamOptions) {

    this.started = false;

    if (reader == null) throw new errors.NullOrEmptyArgumentError("reader");
    var defaultWaterMark = 32;

    this.highWaterMark = (options == null || options.highWaterMark == null) ? defaultWaterMark : options.highWaterMark;
    this.closeOnEmpty = (options == null || options.closeOnEmpty == null) ? false : options.closeOnEmpty;

    super({ objectMode: true, highWaterMark: this.highWaterMark });

    var me = this;

    me.reader = reader;

    me.reader.on("message", msg => {
      if (!me.push(msg)) {

        me.started = false;

        me.flushReceiptLog();
        me.reader.pause();
      }
    });

    me.reader.on("stopped",() => {
      me.push(null);
      me.emit("done");

    });

    me.reader.on("error", err => {
      me.emit("error", err);
    });

    me.reader.on("empty",() => {
      me.emit("empty");
    });


  }

  //IMessageDeleter
  public deleteMessage(message: AWS.Sqs.Message) {
    this.reader.deleteMessage(message);
  }

  public deleteMessages(messages: AWS.Sqs.Message[]) {
    this.reader.deleteMessages(messages);
  }

  public flushReceiptLog() {
    this.reader.flushReceiptLog();
  }

  public _read(size?: number) {


    if (this.started == false) {
      this.started = true;
      this.reader.start();
    }
  }

  public close() {
    this.reader.stop();
    this.push(null);
  }
}
