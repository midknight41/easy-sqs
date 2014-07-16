///<reference path="../imports.d.ts"/>

import easy = require("../EasySqs");
import sdk = require("aws-sdk");
import help = require("../Helpers/TestHelper");
import errors = require("../CustomErrors");

var gently = new (require("gently"));

var testGroup = {
  setUp: function (callback: nodeunit.ICallbackFunction): void {
    callback();
  },
  tearDown: function (callback: nodeunit.ICallbackFunction): void {
    callback();
  },
  "correctly construct a queue": function (test: nodeunit.Test): void {

    var aws = gently.stub("aws-sdk", "SQS");
    var client = gently.stub("aws-sdk", "Sqs.Client");
    aws.client = client;

    var q = new easy.Queue("myQueue", aws);

    test.notEqual(q, null, "");

    test.done();
  },
  "constructor deals with bad parameters": function (test: nodeunit.Test): void {

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
  "Can get a single message from queue": function (test: nodeunit.Test): void {

    var aws = gently.stub("aws-sdk", "SQS");
    //var client = gently.stub("aws-sdk", "Sqs.Client");
    //aws.client = client;

    gently.expect(aws, "receiveMessage", function (params, callback: (err, data) => void) {

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
  "Can put a single message onto a queue": function (test: nodeunit.Test): void {

    var aws = gently.stub("aws-sdk", "SQS");
    //var client = gently.stub("aws-sdk", "Sqs.Client");
    //aws.client = client;

    gently.expect(aws, "sendMessage", function (params, callback: (err) => void) {

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
  "Prevents a bad message from being placed on the queue": function (test: nodeunit.Test): void {

    var aws = gently.stub("aws-sdk", "SQS");
    //var client = gently.stub("aws-sdk", "Sqs.Client");
    //aws.client = client;

    var q = new easy.Queue("myQueue", aws);

    var a: any = new Array(262145);

    for (var i = 0; i < a.length; i++) {
      a[i] = "0";
    }

    var data = a.join("");

    q.sendMessage(data, function (err) {
      test.equal(err.name, new errors.InvalidArgumentError().name, "unexpected error received");
    });

    q.sendMessage(null, function (err) {
      test.equal(err.name, new errors.NullArgumentError().name, "unexpected error received");
    });

    test.done();
  },
  "Can delete a message from the queue": function (test: nodeunit.Test): void {

    var aws = gently.stub("aws-sdk", "SQS");
    //var client = gently.stub("aws-sdk", "Sqs.Client");
    //aws.client = client;

    gently.expect(aws, "deleteMessage", function (params, callback: (err) => void) {

      setImmediate(function () {

        test.equal(params.QueueUrl, "myQueue");
        test.equal(params.ReceiptHandle, "handle");
        callback(null);

      });

    });

    var q = new easy.Queue("myQueue", aws);

    var msg: sdk.Sqs.Message = { MessageId: "id", ReceiptHandle: "handle", MD5OfBody: "md5", Body: "body", Attributes: [] };

    q.deleteMessage(msg, function (err) {
      test.equal(err, null, "unexpected error received");
    });

    test.done();
  },
  "validates data before submitting the delete message request": function (test: nodeunit.Test): void {

    var aws = gently.stub("aws-sdk", "SQS");
    //var client = gently.stub("aws-sdk", "Sqs.Client");
    //aws.client = client;

    var q = new easy.Queue("myQueue", aws);

    var msg: sdk.Sqs.Message = { MessageId: "", ReceiptHandle: "", MD5OfBody: "md5", Body: "body", Attributes: [] };

    q.deleteMessage(msg, function (err) {
      test.equal(err.name, new errors.InvalidArgumentError().name, "unexpected error received");
    });

    q.deleteMessage(null, function (err) {
      test.equal(err.name, new errors.NullArgumentError().name, "unexpected error received");
    });

    test.done();
  }

};

exports.easySqsTests = testGroup;