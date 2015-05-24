var easy = require("../EasySqs");
var help = require("../Helpers/TestHelper");
var errors = require("../CustomErrors");
var gently = new (require("gently"));
var testGroup = {
    setUp: function (callback) {
        callback();
    },
    tearDown: function (callback) {
        callback();
    },
    "correctly construct a queue": function (test) {
        var aws = gently.stub("aws-sdk", "SQS");
        var client = gently.stub("aws-sdk", "Sqs.Client");
        aws.client = client;
        var q = new easy.Queue("myQueue", aws);
        test.notEqual(q, null, "");
        test.done();
    },
    "constructor deals with bad parameters": function (test) {
        var aws = gently.stub("aws-sdk", "SQS");
        var client = gently.stub("aws-sdk", "Sqs.Client");
        aws.client = client;
        help.nullErrorTest(test, function () {
            var q = new easy.Queue("myQueue", null);
        });
        help.nullErrorTest(test, function () {
            var q = new easy.Queue(null, aws);
        });
        help.invalidArgumentErrorTest(test, function () {
            var q = new easy.Queue("", aws);
        });
        test.done();
    },
    "Can get a single message from queue": function (test) {
        var aws = gently.stub("aws-sdk", "SQS");
        //var client = gently.stub("aws-sdk", "Sqs.Client");
        //aws.client = client;
        gently.expect(aws, "receiveMessage", function (params, callback) {
            var res = {
                Messages: ["one"]
            };
            test.equal(params.QueueUrl, "myQueue");
            callback(null, res);
        });
        var q = new easy.Queue("myQueue", aws);
        q.getMessage(function (err, data) {
            test.equal(err, null, "unexpected error received");
            test.equal(data, "one", "incorrect message received");
        });
        test.done();
    },
    "Can put a single message onto a queue": function (test) {
        var aws = gently.stub("aws-sdk", "SQS");
        //var client = gently.stub("aws-sdk", "Sqs.Client");
        //aws.client = client;
        gently.expect(aws, "sendMessage", function (params, callback) {
            test.equal(params.QueueUrl, "myQueue");
            test.equal(params.MessageBody, "data");
            callback(null);
        });
        var q = new easy.Queue("myQueue", aws);
        q.sendMessage("data", function (err) {
            test.equal(err, null, "unexpected error received");
        });
        test.done();
    },
    "Prevents a bad message from being placed on the queue": function (test) {
        var aws = gently.stub("aws-sdk", "SQS");
        //var client = gently.stub("aws-sdk", "Sqs.Client");
        //aws.client = client;
        var q = new easy.Queue("myQueue", aws);
        var a = new Array(262145);
        for (var i = 0; i < a.length; i++) {
            a[i] = "0";
        }
        var data = a.join("");
        q.sendMessage(data, function (err) {
            test.equal(err.name, new errors.InvalidArgumentError().name, "unexpected error received");
        });
        q.sendMessage(null, function (err) {
            test.equal(err.name, new errors.NullOrEmptyArgumentError().name, "unexpected error received");
        });
        test.done();
    },
    "Can delete a message from the queue": function (test) {
        var aws = gently.stub("aws-sdk", "SQS");
        gently.expect(aws, "deleteMessage", function (params, callback) {
            setImmediate(function () {
                test.equal(params.QueueUrl, "myQueue");
                test.equal(params.ReceiptHandle, "handle");
                callback(null);
            });
        });
        var q = new easy.Queue("myQueue", aws);
        var msg = { MessageId: "id", ReceiptHandle: "handle", MD5OfBody: "md5", Body: "body", Attributes: [] };
        q.deleteMessage(msg, function (err) {
            test.equal(err, null, "unexpected error received");
        });
        test.done();
    },
    "validates data before submitting the delete message request": function (test) {
        var aws = gently.stub("aws-sdk", "SQS");
        var q = new easy.Queue("myQueue", aws);
        var msg = { MessageId: "", ReceiptHandle: "", MD5OfBody: "md5", Body: "body", Attributes: [] };
        q.deleteMessage(msg, function (err) {
            test.equal(err.name, new errors.InvalidArgumentError().name, "unexpected error received");
        });
        q.deleteMessage(null, function (err) {
            test.equal(err.name, new errors.NullOrEmptyArgumentError().name, "unexpected error received");
        });
        test.done();
    },
    "can create QueueReader": function (test) {
        var aws = gently.stub("aws-sdk", "SQS");
        var q = new easy.Queue("myQueue", aws);
        var batchSize = 10;
        var reader = q.createQueueReader(batchSize);
        test.notEqual(reader, null);
        test.done();
    },
    "can create MessageStream": function (test) {
        var aws = gently.stub("aws-sdk", "SQS");
        var queue = new easy.Queue("myQueue", aws);
        var batchSize = 10;
        var highWatermark = 10;
        var stream = queue.createMessageStream(highWatermark, batchSize);
        test.notEqual(stream, null);
        test.done();
    },
    "drainQueue can empty a queue": function (test) {
        var aws = gently.stub("aws-sdk", "SQS");
        var queue = new easy.Queue("myQueue", aws);
        var batchSize = 10;
        gently.expect(aws, "receiveMessage", function (params, callback) {
            var res = {
                Messages: ["one"],
                ReceiptHandle: "handle"
            };
            test.equal(params.QueueUrl, "myQueue");
            callback(null, res);
        });
        gently.expect(aws, "deleteMessageBatch", function (params, callback) {
            console.log(params);
            test.equal(params.QueueUrl, "myQueue");
            callback(null);
        });
        gently.expect(aws, "receiveMessage", function (params, callback) {
            var res = {
                Messages: null,
                ReceiptHandle: "handle"
            };
            test.equal(params.QueueUrl, "myQueue");
            callback(null, res);
        });
        queue.drain(function (err) {
            console.log("final?", err);
            test.equal(err, null);
            test.done();
        });
    },
    "b": function (test) {
        test.done();
    },
    "c": function (test) {
        test.done();
    },
    "d": function (test) {
        test.done();
    },
    "e": function (test) {
        test.done();
    }
};
exports.easySqsTests = testGroup;
//# sourceMappingURL=EasySqs-test.js.map