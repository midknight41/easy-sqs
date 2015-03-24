var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var errors = require("./CustomErrors");
var streams = require("stream");
var MessageStream = (function (_super) {
    __extends(MessageStream, _super);
    function MessageStream(reader, options) {
        this.started = false;
        if (reader == null)
            throw new errors.NullOrEmptyArgumentError("reader");
        var defaultWaterMark = 32;
        this.highWaterMark = (options == null || options.highWaterMark == null) ? defaultWaterMark : options.highWaterMark;
        this.closeOnEmpty = (options == null || options.closeOnEmpty == null) ? false : options.closeOnEmpty;
        _super.call(this, { objectMode: true, highWaterMark: this.highWaterMark });
        var me = this;
        me.reader = reader;
        me.reader.on("message", function (msg) {
            if (!me.push(msg)) {
                me.started = false;
                me.flushReceiptLog();
                me.reader.pause();
            }
        });
        me.reader.on("stopped", function () {
            me.push(null);
            me.emit("done");
        });
        me.reader.on("error", function (err) {
            me.emit("error", err);
        });
        me.reader.on("empty", function () {
            me.emit("empty");
        });
    }
    //IMessageDeleter
    MessageStream.prototype.deleteMessage = function (message) {
        this.reader.deleteMessage(message);
    };
    MessageStream.prototype.deleteMessages = function (messages) {
        this.reader.deleteMessages(messages);
    };
    MessageStream.prototype.flushReceiptLog = function () {
        this.reader.flushReceiptLog();
    };
    MessageStream.prototype._read = function (size) {
        if (this.started == false) {
            this.started = true;
            this.reader.start();
        }
    };
    MessageStream.prototype.close = function () {
        this.reader.stop();
        this.push(null);
    };
    return MessageStream;
})(streams.Readable);
exports.MessageStream = MessageStream;
//# sourceMappingURL=MessageStream.js.map