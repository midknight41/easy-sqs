var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var errors = require("./CustomErrors");
var events = require("events");
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
            this.deleter = new MessageDeleter(me.sqs, me.queueName, me.batchSize, me.errorHandler);
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
var MessageDeleter = (function (_super) {
    __extends(MessageDeleter, _super);
    //This signature should be changed to drop errorHandler in favour of on("error")
    function MessageDeleter(sqs, queueName, batchSize, errorHandler) {
        _super.call(this);
        this.receiptLog = [];
        if (queueName == null || queueName.length == 0)
            throw new Error("queueName was not provided");
        if (sqs == null)
            throw new Error("sqs was not provided");
        //swallow errors if null
        this.errorHandler = errorHandler != null ? errorHandler : function (err) {
        };
        this.sqs = sqs;
        this.threshold = batchSize > 0 ? batchSize : 1;
        this.queueName = queueName;
    }
    MessageDeleter.prototype.deleteMessage = function (message) {
        this.receiptLog.push(message);
        this.flushIfThresholdExceeded();
    };
    MessageDeleter.prototype.deleteMessages = function (messages) {
        var me = this;
        messages.forEach(function (value, index, array) {
            me.receiptLog.push(value);
        });
        me.flushIfThresholdExceeded();
    };
    MessageDeleter.prototype.flushIfThresholdExceeded = function () {
        if (this.receiptLog.length >= this.threshold) {
            this.flushReceiptLog();
        }
    };
    MessageDeleter.prototype.flushReceiptLog = function () {
        if (this.receiptLog.length > 0) {
            this.cleanUp(this.sqs, this);
        }
    };
    MessageDeleter.prototype.cleanUp = function (client, parent) {
        var i = 0;
        var list = [];
        parent.receiptLog.forEach(function (msg, index, array) {
            list.push(msg.ReceiptHandle);
            i++;
            if (i == parent.threshold || index == array.length - 1) {
                parent.deleteMessageBatch(client, parent.queueName, list);
                list = new Array();
                i = 0;
            }
            if (index == array.length - 1) {
                parent.receiptLog = [];
            }
        });
    };
    MessageDeleter.prototype.deleteMessageBatch = function (client, queueName, handles) {
        var entries = [];
        var me = this;
        for (var i = 0; i < handles.length; i++) {
            var entry = {
                Id: i.toString(),
                ReceiptHandle: handles[i]
            };
            entries.push(entry);
        }
        var params = {
            QueueUrl: queueName,
            Entries: entries
        };
        client.deleteMessageBatch(params, function (err, data) {
            if (err) {
                me.emit("error", err);
                me.errorHandler(err);
            }
        });
    };
    return MessageDeleter;
})(events.EventEmitter);
exports.MessageDeleter = MessageDeleter;
var flushCount = 0;
//# sourceMappingURL=EasyQueueReader.js.map