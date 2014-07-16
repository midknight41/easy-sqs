/// <reference path="./imports.d.ts" />
var reader = require("./EasyQueueReader");
var errors = require("./CustomErrors");

var Queue = (function () {
    function Queue(queueName, sqs) {
        if (queueName == null)
            throw new errors.NullArgumentError("queueName");
        if (queueName.length == 0)
            throw new errors.InvalidArgumentError("queueName not provided");
        if (sqs == null)
            throw new errors.NullArgumentError("sqs");

        this.queueName = queueName;
        this.sqs = sqs;
    }
    Queue.prototype.createQueueReader = function () {
        return new reader.QueueReader(this.sqs, this.queueName);
    };

    Queue.prototype.drain = function (callback) {
        var queue = this;

        var queueReader = queue.createQueueReader();

        queueReader.onReceipt(function readMessages(err, data, context) {
            if (data != null) {
                data.forEach(function (value, i, list) {
                    context.deleteMessage(value);
                });
            }
        }).onEmpty(function (err) {
            //all done, stop monitoring the queue
            queueReader.stop();

            if (callback != null) {
                callback(err);
            }
        }, true).start();
    };

    Queue.prototype.getMessage = function (callback) {
        var client = this.sqs;
        var params = {};

        params.QueueUrl = this.queueName, params.MaxNumberOfMessages = 1;

        client.receiveMessage(params, function (err, data) {
            if (data.Messages != null && data.Messages.length > 0) {
                var msg = data.Messages[0];
                callback(err, msg);
            }
        });
    };

    Queue.prototype.deleteMessage = function (msg, callback) {
        var client = this.sqs;
        var params = {};

        if (msg == null) {
            callback(new errors.NullArgumentError("msg"));
            return;
        }

        if (msg.ReceiptHandle == null || msg.ReceiptHandle.length == 0) {
            callback(new errors.InvalidArgumentError("msg.ReceiptHandle cannot be null or empty"));
            return;
        }

        params.QueueUrl = this.queueName, params.ReceiptHandle = msg.ReceiptHandle;

        client.deleteMessage(params, function (err, data) {
            callback(err);
        });
    };

    Queue.prototype.sendMessage = function (data, callback) {
        var client = this.sqs;

        if (data == null) {
            callback(new errors.NullArgumentError("Data cannot be null"));
            return;
        }
        if (data.length > 262144) {
            callback(new errors.InvalidArgumentError("data too large for SQS"));
            return;
        }

        var params = {};

        params.QueueUrl = this.queueName;
        params.MessageBody = data;

        client.sendMessage(params, function (err, data) {
            callback(err);
        });
    };
    return Queue;
})();
exports.Queue = Queue;
//# sourceMappingURL=EasySqs.js.map
