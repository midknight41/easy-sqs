var readers = require("../EasyQueueReader");
var errors = require("../CustomErrors");
var gently = new (require("gently"));
var messages = [
    {
        MessageId: "1234",
        Body: "{msg: 'test'}",
        ReceiptHandle: "423421",
        MD5OfBody: "MD55",
        Attributes: []
    }
];
var testGroup = {
    setUp: function (callback) {
        callback();
    },
    tearDown: function (callback) {
        callback();
    },
    "correctly construct a QueueReader": function (test) {
        var aws = gently.stub("aws-sdk", "SQS");
        var reader = new readers.QueueReader(aws, "name");
        test.done();
    },
    "can recieve a message": function (test) {
        var aws = gently.stub("aws-sdk", "SQS");
        var reader = new readers.QueueReader(aws, "name");
        gently.expect(aws, "receiveMessage", function (params, cb) {
            var data = { Messages: messages };
            cb(null, data);
        });
        reader.on("message", function (msg, deleter) {
            reader.stop();
            test.equal(msg, messages[0]);
            test.done();
        });
        reader.start();
    },
    "can receive an empty signal": function (test) {
        var aws = gently.stub("aws-sdk", "SQS");
        var reader = new readers.QueueReader(aws, "name");
        gently.expect(aws, "receiveMessage", function (params, cb) {
            var data = { Messages: null };
            cb(null, data);
        });
        reader.on("empty", function (err) {
            reader.stop();
            test.done();
        });
        reader.start();
    },
    "can emit an error when it happens": function (test) {
        var aws = gently.stub("aws-sdk", "SQS");
        var reader = new readers.QueueReader(aws, "name");
        var error = new Error("my error");
        gently.expect(aws, "receiveMessage", function (params, cb) {
            var data = { Messages: null };
            cb(error, null);
        });
        reader.on("error", function (err) {
            reader.stop();
            test.equal(err, error);
            test.done();
        });
        reader.start();
    },
    "throws error when no queue name is provided": function (test) {
        var aws = gently.stub("aws-sdk", "SQS");
        test.throws(function () {
            var reader = new readers.QueueReader(aws, null);
        }, errors.NullOrEmptyArgumentError);
        test.throws(function () {
            var reader = new readers.QueueReader(aws, "");
        }, errors.InvalidArgumentError);
        test.done();
    },
    "throws error is not aws param is provided": function (test) {
        test.throws(function () {
            var reader = new readers.QueueReader(null, "name");
        }, errors.NullOrEmptyArgumentError);
        test.done();
    },
    "throws error if batchSize is < 0": function (test) {
        var aws = gently.stub("aws-sdk", "SQS");
        test.throws(function () {
            var reader = new readers.QueueReader(aws, "name", -1);
        }, errors.InvalidArgumentError);
        test.done();
    },
    "batchSize defaults to 10 if it isn't provided": function (test) {
        var aws = gently.stub("aws-sdk", "SQS");
        var reader = new readers.QueueReader(aws, "name");
        test.equal(reader.batchSize, 10);
        test.done();
    },
    "batchSize is set properly if it's provided": function (test) {
        var aws = gently.stub("aws-sdk", "SQS");
        var reader = new readers.QueueReader(aws, "name");
        test.equal(reader.batchSize, 10);
        test.done();
    }
};
exports.QueueReaderTests = testGroup;
//# sourceMappingURL=QueueReader-test.js.map