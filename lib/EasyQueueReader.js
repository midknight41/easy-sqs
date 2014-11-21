var errors = require("./CustomErrors");
var QueueReader = (function () {
    function QueueReader(sqs, queueName, batchSize) {
        this.listening = false;
        if (queueName == null)
            throw new errors.NullArgumentError("queueName");
        if (queueName.length == 0)
            throw new errors.InvalidArgumentError("queueName cannot be an empty string");
        if (sqs == null)
            throw new errors.NullArgumentError("sqs");
        if (batchSize == null)
            batchSize = 10;
        if (batchSize <= 0)
            throw new errors.InvalidArgumentError("batchSize must be a positive number");
        this.sqs = sqs;
        this.queueName = queueName;
        this.batchSize = batchSize;
    }
    QueueReader.prototype.onReceipt = function (callback) {
        this.receiptCallback = callback;
        return this;
    };
    QueueReader.prototype.onEmpty = function (callback) {
        this.emptyCallback = callback;
        return this;
    };
    QueueReader.prototype.onError = function (callback) {
        this.errorHandler = callback;
        return this;
    };
    QueueReader.prototype.start = function () {
        this.checkEventsAreSetupCorrectly();
        var me = this;
        var deleter = new MessageDeleter(me.sqs, me.queueName, me.batchSize, me.errorHandler);
        me.listening = true;
        process.nextTick(function () {
            me.internalMonitorQueue(deleter);
        });
    };
    QueueReader.prototype.checkEventsAreSetupCorrectly = function () {
        if (this.receiptCallback == null)
            throw new Error("onReceipt() hass not been correctly initialised");
        //if no proper handler is set up then console.log to provide some visibility
        this.errorHandler = this.errorHandler != null ? this.errorHandler : function (err) {
            console.log("SimpleQueueReader error: ", err);
        };
        //not needed in all implementations
        this.emptyCallback = this.emptyCallback != null ? this.emptyCallback : function (err) {
        };
    };
    QueueReader.prototype.stop = function () {
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
        deleter.flush();
        //abort after cleaning up
        if (me.listening == false)
            return;
        //else console.log("listening");
        client.receiveMessage(params, function (err, data) {
            if (err != null) {
                console.log("error receiving message:" + err);
                me.errorHandler(err);
                deleter.flush();
                return;
            }
            if (data.Messages != null) {
                //console.log("got messages");
                me.receiptCallback(err, data.Messages, deleter);
                me.internalMonitorQueue(deleter);
            }
            else {
                me.emptyCallback(err);
                deleter.flush();
                me.internalMonitorQueue(deleter);
            }
        });
    };
    return QueueReader;
})();
exports.QueueReader = QueueReader;
//can this all be replaced with async.cargo?
var MessageDeleter = (function () {
    function MessageDeleter(sqs, queueName, batchSize, errorHandler) {
        this.recieptLog = [];
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
        this.recieptLog.push(message);
        this.flushIfThresholdExceeded();
    };
    MessageDeleter.prototype.deleteMessages = function (messages) {
        var me = this;
        messages.forEach(function (value, index, array) {
            me.recieptLog.push(value);
        });
        me.flushIfThresholdExceeded();
    };
    MessageDeleter.prototype.flushIfThresholdExceeded = function () {
        if (this.recieptLog.length >= this.threshold) {
            this.flush();
        }
    };
    MessageDeleter.prototype.flush = function () {
        if (this.recieptLog.length > 0) {
            this.cleanUp(this.sqs, this);
        }
    };
    MessageDeleter.prototype.cleanUp = function (client, parent) {
        var i = 0;
        var list = [];
        parent.recieptLog.forEach(function (msg, index, array) {
            list.push(msg.ReceiptHandle);
            i++;
            if (i == parent.threshold || index == array.length - 1) {
                parent.deleteMessageBatch(client, parent.queueName, list);
                list = new Array();
                i = 0;
            }
            if (index == array.length - 1) {
                parent.recieptLog = [];
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
            if (err != null)
                me.errorHandler(err);
        });
    };
    return MessageDeleter;
})();
exports.MessageDeleter = MessageDeleter;
//# sourceMappingURL=EasyQueueReader.js.map