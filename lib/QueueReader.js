var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var errors = require("./CustomErrors");
var events = require("events");
var md = require("./MessageDeleter");
var QueueReader = (function (_super) {
    __extends(QueueReader, _super);
    function QueueReader(sqs, queueName, batchSize) {
        _super.call(this);
        this.listening = false;
        this.stopping = false;
        if (queueName == null)
            throw new errors.NullOrEmptyArgumentError("queueName");
        if (queueName.length == 0)
            throw new errors.InvalidArgumentError("queueName cannot be an empty string");
        if (sqs == null)
            throw new errors.NullOrEmptyArgumentError("sqs");
        if (batchSize == null)
            batchSize = 10;
        if (batchSize <= 0)
            throw new errors.InvalidArgumentError("batchSize must be a positive number");
        this.sqs = sqs;
        this.queueName = queueName;
        this.batchSize = batchSize;
        this.init = false;
    }
    //Legacy API
    QueueReader.prototype.onReceipt = function (callback) {
        console.info("onReceipt is deprecated. Use on(\"message\") instead. See README.md for usage.");
        this.receiptCallback = callback;
        return this;
    };
    QueueReader.prototype.onEmpty = function (callback) {
        console.info("onEmpty is deprecated. Use on(\"empty\") instead. See README.md for usage.");
        this.emptyCallback = callback;
        return this;
    };
    QueueReader.prototype.onError = function (callback) {
        console.info("onError is deprecated. Use on(\"error\") instead. See README.md for usage.");
        this.errorHandler = callback;
        return this;
    };
    QueueReader.prototype.start = function () {
        var me = this;
        this.checkEventsAreSetupCorrectly();
        if (this.deleter == null) {
            this.deleter = new md.MessageDeleter(me.sqs, me.queueName, me.batchSize, me.errorHandler);
        }
        me.listening = true;
        process.nextTick(function () {
            me.internalMonitorQueue(me.deleter);
        });
    };
    QueueReader.prototype.checkEventsAreSetupCorrectly = function () {
        this.receiptCallback = this.receiptCallback != null ? this.receiptCallback : function (err, messages, context) {
        };
        this.errorHandler = this.errorHandler != null ? this.errorHandler : function (err) {
        };
        //not needed in all implementations
        this.emptyCallback = this.emptyCallback != null ? this.emptyCallback : function (err) {
        };
    };
    //stop will emit a stopped event which can be used to shut down a queue reader
    //pause will stop reading, but it will not emit the stopped event. This is aid
    //piping with the MessageStream class
    QueueReader.prototype.stop = function () {
        this.listening = false;
        this.stopping = true;
    };
    QueueReader.prototype.pause = function () {
        this.listening = false;
    };
    QueueReader.prototype.internalMonitorQueue = function (deleter) {
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
                data.Messages.forEach(function (message) {
                    me.emit("message", message, deleter);
                });
                me.receiptCallback(err, data.Messages, deleter); //To be deprecated
                me.internalMonitorQueue(deleter);
            }
            else {
                me.emit("empty", err);
                me.emptyCallback(err); //To be deprecated
                deleter.flushReceiptLog();
                me.internalMonitorQueue(deleter);
            }
        });
    };
    //IMessageDeleter
    QueueReader.prototype.deleteMessage = function (message) {
        this.deleter.deleteMessage(message);
    };
    QueueReader.prototype.deleteMessages = function (messages) {
        this.deleter.deleteMessages(messages);
    };
    QueueReader.prototype.flushReceiptLog = function () {
        this.deleter.flushReceiptLog();
    };
    return QueueReader;
})(events.EventEmitter);
exports.QueueReader = QueueReader;
//# sourceMappingURL=QueueReader.js.map