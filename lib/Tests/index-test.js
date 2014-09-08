///<reference path="../imports.d.ts"/>
var lib = require("../index");

var gently = new (require("gently"));

var testGroup = {
    setUp: function (callback) {
        callback();
    },
    tearDown: function (callback) {
        callback();
    },
    "can create a queue": function (test) {
        var aws = gently.stub("aws-sdk", "SQS");

        var name = "testName";
        var options = {};

        gently.expect(aws, "createQueue", function (params, callback) {
            var result = {
                QueueUrl: "myUrl"
            };

            test.equal(params.QueueName, name, "queue name not set");
            test.equal(params.Attributes, options, "queue name not set");

            callback(null, result);
        });

        var easyClient = new lib.SqsClient(aws);

        easyClient.createQueue("testName", options, function (err, queue) {
            test.notEqual(queue, null, "queue object not returned");
            test.equal(queue.queueName, "myUrl", "url not returned");
            test.done();
        });
    },
    "can get a queue that exists": function (test) {
        var aws = gently.stub("aws-sdk", "SQS");

        gently.expect(aws, "getQueueAttributes", function (params, callback) {
            var result = { ResponseMetadata: { RequestId: '320da1xb-5569-5713-9f8e-ed3d295b6238' } };

            callback(null, result);
        });

        var easyClient = new lib.SqsClient(aws);

        easyClient.getQueue("https://sqs.eu-west-1.amazonaws.com/123/queueName", function (err, queue) {
            test.equal(err, null, "an unexpected error occurred");
            test.notEqual(queue, null, "");

            test.done();
        });
    },
    "returns an error when the queue doesn't exist": function (test) {
        var aws = gently.stub("aws-sdk", "SQS");

        gently.expect(aws, "getQueueAttributes", function (params, callback) {
            var err = {
                message: 'The specified queue does not exist for this wsdl version.',
                code: 'AWS.SimpleQueueService.NonExistentQueue'
            };

            callback(err, null);
        });

        var easyClient = new lib.SqsClient(aws);

        easyClient.getQueue("https://sqs.eu-west-1.amazonaws.com/123/queueName", function (err, queue) {
            var box = err;

            test.equal(box.code, 'AWS.SimpleQueueService.NonExistentQueue', "an unexpected error occurred");
            test.equal(queue, null, "");

            test.done();
        });
    }
};

exports.indexTests = testGroup;
//# sourceMappingURL=index-test.js.map
