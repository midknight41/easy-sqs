import streams = require("../MessageStream");
import readers = require("../EasyQueueReader");
import sdk = require("aws-sdk");
import help = require("../Helpers/TestHelper");
import errors = require("../CustomErrors");
import events = require("events");
import nodeStream = require("stream");

var gently = new (require("gently"));

var testGroup = {
  setUp: function (callback: nodeunit.ICallbackFunction): void {
    callback();
  },
  tearDown: function (callback: nodeunit.ICallbackFunction): void {
    callback();
  },
  "correctly construct a MessageStream": function (test: nodeunit.Test): void {

    var reader = new MockReader();

    var stream = new streams.MessageStream(reader);


    test.done();
  },
  "can call for a message": function (test: nodeunit.Test): void {

    var reader = new MockReader();

    var stream = new streams.MessageStream(reader);

    gently.expect(reader, "start",() => {
      reader.emit("message", "{test:msg}");
    });

    gently.expect(stream, "push", msg => {
      test.equal(msg, "{test:msg}");
      test.done();
      return true;
    });

    stream._read();
  },
  "can pause the stream when told to": function (test: nodeunit.Test): void {

    var reader = new MockReader();

    var stream = new streams.MessageStream(reader);

    gently.expect(reader, "start",() => {
      reader.emit("message", "{test:msg}");
    });

    gently.expect(stream, "push", msg => {
      test.equal(msg, "{test:msg}");
      return false;
    });

    gently.expect(reader, "pause",() => {
      test.done();
      return true;
    });

    stream._read();
  },
  "can resume a paused stream when told to": function (test: nodeunit.Test): void {

    var reader = new MockReader();

    var stream = new streams.MessageStream(reader);

    gently.expect(reader, "start",() => {
      reader.emit("message", "{test:msg}");
    });

    gently.expect(stream, "push", msg => {
      test.equal(msg, "{test:msg}");
      return false;
    });

    gently.expect(reader, "pause",() => {
      stream._read();
    });

    gently.expect(reader, "start",() => {
      reader.emit("message", "{test:msg2}");
    });

    gently.expect(stream, "push", msg => {
      test.equal(msg, "{test:msg2}");
      test.done();
      return true;
    });

    stream._read();
  },
  "can close a stream when told to": function (test: nodeunit.Test): void {

    var reader = new MockReader();

    var stream = new streams.MessageStream(reader);

    gently.expect(reader, "start",() => {
      reader.emit("message", "{test:msg}");
    });

    gently.expect(stream, "push", msg => {
      test.equal(msg, "{test:msg}");
      stream.close();
      return true;
    });

    gently.expect(reader, "stop",() => {
      return true;
    });

    gently.expect(stream, "push", msg => {

      test.equal(msg, null);
      test.done();

      return true;
    });

    stream._read();
  },
  "can pipe to writable stream": function (test: nodeunit.Test): void {

    var reader = new MockReader();
    var testMsg = "{test:msg}";

    var stream = new streams.MessageStream(reader);

    gently.expect(reader, "start",() => {

      reader.emit("message", testMsg);
      process.nextTick(() => {
        reader.emit("stopped");
      });

    });

    var writable = new TestWritable((msg) => {
      test.equal(msg, testMsg);

    });

    stream.pipe(writable);


    stream.on("done",() => {
      test.done();

    });

  },
  "can pipe the correct number of message to writable stream": function (test: nodeunit.Test): void {

    var reader = new MockReader();
    var testMsg = "{test:msg}";

    var stream = new streams.MessageStream(reader);

    gently.expect(reader, "start",() => {

      for (var i = 0; i < 1000; i++) {
        reader.emit("message", testMsg);
      }

      setImmediate(() => {
        reader.emit("stopped");
      });

    });
    var counter = 0;

    var writable = new TestWritable((msg) => {
      counter++;
    });

    stream.pipe(writable);


    stream.on("done",() => {
      test.equal(counter, 1000);
      test.done();

    });

  },
  "throws error on bad reader param": function (test: nodeunit.Test): void {

    test.throws(() => {

      var stream = new streams.MessageStream(null);

    }, errors.NullOrEmptyArgumentError);
    


    test.done();
  },
  "sets default appropriately when option is null": function (test: nodeunit.Test): void {

    var reader = new MockReader();
    var stream = new streams.MessageStream(reader);

    test.equal(stream.closeOnEmpty, false);
    test.equal(stream.highWaterMark, 32);

    test.done();

  },
  "sets highwatermark when supplied": function (test: nodeunit.Test): void {
    var reader = new MockReader();
    var stream = new streams.MessageStream(reader, {highWaterMark: 16});

    test.equal(stream.closeOnEmpty, false);
    test.equal(stream.highWaterMark, 16);

    test.done();

  },
  "sets closeOnEmpty when supplied": function (test: nodeunit.Test): void {
    var reader = new MockReader();
    var stream = new streams.MessageStream(reader, {closeOnEmpty: true });

    test.equal(stream.closeOnEmpty, true);
    test.equal(stream.highWaterMark, 32);

    test.done();

  }

};

class MockReader extends events.EventEmitter implements readers.IQueueReader {

  public onReceipt(callback: (err, messages: sdk.Sqs.Message[], context: readers.IMessageDeleter) => void) { }
  public onEmpty(callback: (err) => void) { }
  public start() { }
  public stop() { }
  public pause() { }
  public receiptCallback: (err: Error, messages: sdk.Sqs.Message[], context: readers.IMessageDeleter) => void;
  public emptyCallback: (err: Error) => void;
  public errorHandler: (err: Error) => void;
  public deleteMessage(message: sdk.Sqs.Message) { }
  public deleteMessages(messages: sdk.Sqs.Message[]) { }
  public flushReceiptLog() { }

}

class TestWritable extends nodeStream.Writable {

  private hasWrittenCallback;

  constructor(hasWrittenCallback: Function) {
    super({ objectMode: true });

    this.hasWrittenCallback = hasWrittenCallback;

  }

  public _write(buffer: NodeBuffer|string, cbOrEncoding?: Function|string, finalCb?: Function): boolean {
    var cb = null;
    var encoding;

    if (typeof cbOrEncoding != "string") {
      cb = cbOrEncoding;
      encoding = "";
    } else {
      cb = finalCb;
      encoding = cbOrEncoding;
    }

    this.hasWrittenCallback(buffer);
    return cb();
  }

}

exports.MessageStreamTests = testGroup;