var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var events = require("events");
var nodeStream = require("stream");
var streams = require("../MessageStream");
var errors = require("../CustomErrors");
var gently = new (require("gently"));
var testGroup = {
    setUp: function (callback) {
        callback();
    },
    tearDown: function (callback) {
        callback();
    },
    "correctly construct a MessageStream": function (test) {
        var reader = new MockReader();
        var stream = new streams.MessageStream(reader);
        test.done();
    },
    "can call for a message": function (test) {
        var reader = new MockReader();
        var stream = new streams.MessageStream(reader);
        gently.expect(reader, "start", function () {
            reader.emit("message", "{test:msg}");
        });
        gently.expect(stream, "push", function (msg) {
            test.equal(msg, "{test:msg}");
            test.done();
            return true;
        });
        stream._read();
    },
    "can pause the stream when told to": function (test) {
        var reader = new MockReader();
        var stream = new streams.MessageStream(reader);
        gently.expect(reader, "start", function () {
            reader.emit("message", "{test:msg}");
        });
        gently.expect(stream, "push", function (msg) {
            test.equal(msg, "{test:msg}");
            return false;
        });
        gently.expect(reader, "pause", function () {
            test.done();
            return true;
        });
        stream._read();
    },
    "can resume a paused stream when told to": function (test) {
        var reader = new MockReader();
        var stream = new streams.MessageStream(reader);
        gently.expect(reader, "start", function () {
            reader.emit("message", "{test:msg}");
        });
        gently.expect(stream, "push", function (msg) {
            test.equal(msg, "{test:msg}");
            return false;
        });
        gently.expect(reader, "pause", function () {
            stream._read();
        });
        gently.expect(reader, "start", function () {
            reader.emit("message", "{test:msg2}");
        });
        gently.expect(stream, "push", function (msg) {
            test.equal(msg, "{test:msg2}");
            test.done();
            return true;
        });
        stream._read();
    },
    "can close a stream when told to": function (test) {
        var reader = new MockReader();
        var stream = new streams.MessageStream(reader);
        gently.expect(reader, "start", function () {
            reader.emit("message", "{test:msg}");
        });
        gently.expect(stream, "push", function (msg) {
            test.equal(msg, "{test:msg}");
            stream.close();
            return true;
        });
        gently.expect(reader, "stop", function () {
            return true;
        });
        gently.expect(stream, "push", function (msg) {
            test.equal(msg, null);
            test.done();
            return true;
        });
        stream._read();
    },
    "can pipe to writable stream": function (test) {
        var reader = new MockReader();
        var testMsg = "{test:msg}";
        var stream = new streams.MessageStream(reader);
        gently.expect(reader, "start", function () {
            reader.emit("message", testMsg);
            process.nextTick(function () {
                reader.emit("stopped");
            });
        });
        var writable = new TestWritable(function (msg) {
            test.equal(msg, testMsg);
        });
        stream.pipe(writable);
        stream.on("done", function () {
            test.done();
        });
    },
    "can pipe the correct number of message to writable stream": function (test) {
        var reader = new MockReader();
        var testMsg = "{test:msg}";
        var stream = new streams.MessageStream(reader);
        gently.expect(reader, "start", function () {
            for (var i = 0; i < 1000; i++) {
                reader.emit("message", testMsg);
            }
            setImmediate(function () {
                reader.emit("stopped");
            });
        });
        var counter = 0;
        var writable = new TestWritable(function (msg) {
            counter++;
        });
        stream.pipe(writable);
        stream.on("done", function () {
            test.equal(counter, 1000);
            test.done();
        });
    },
    "throws error on bad reader param": function (test) {
        test.throws(function () {
            var stream = new streams.MessageStream(null);
        }, errors.NullOrEmptyArgumentError);
        test.done();
    },
    "sets default appropriately when option is null": function (test) {
        var reader = new MockReader();
        var stream = new streams.MessageStream(reader);
        test.equal(stream.closeOnEmpty, false);
        test.equal(stream.highWaterMark, 32);
        test.done();
    },
    "sets highwatermark when supplied": function (test) {
        var reader = new MockReader();
        var stream = new streams.MessageStream(reader, { highWaterMark: 16 });
        test.equal(stream.closeOnEmpty, false);
        test.equal(stream.highWaterMark, 16);
        test.done();
    },
    "sets closeOnEmpty when supplied": function (test) {
        var reader = new MockReader();
        var stream = new streams.MessageStream(reader, { closeOnEmpty: true });
        test.equal(stream.closeOnEmpty, true);
        test.equal(stream.highWaterMark, 32);
        test.done();
    }
};
var MockReader = (function (_super) {
    __extends(MockReader, _super);
    function MockReader() {
        _super.apply(this, arguments);
    }
    MockReader.prototype.onReceipt = function (callback) {
    };
    MockReader.prototype.onEmpty = function (callback) {
    };
    MockReader.prototype.start = function () {
    };
    MockReader.prototype.stop = function () {
    };
    MockReader.prototype.pause = function () {
    };
    MockReader.prototype.deleteMessage = function (message) {
    };
    MockReader.prototype.deleteMessages = function (messages) {
    };
    MockReader.prototype.flushReceiptLog = function () {
    };
    return MockReader;
})(events.EventEmitter);
var TestWritable = (function (_super) {
    __extends(TestWritable, _super);
    function TestWritable(hasWrittenCallback) {
        _super.call(this, { objectMode: true });
        this.hasWrittenCallback = hasWrittenCallback;
    }
    TestWritable.prototype._write = function (buffer, cbOrEncoding, finalCb) {
        var cb = null;
        var encoding;
        if (typeof cbOrEncoding != "string") {
            cb = cbOrEncoding;
            encoding = "";
        }
        else {
            cb = finalCb;
            encoding = cbOrEncoding;
        }
        this.hasWrittenCallback(buffer);
        return cb();
    };
    return TestWritable;
})(nodeStream.Writable);
exports.MessageStreamTests = testGroup;
//# sourceMappingURL=MessageStream-test.js.map