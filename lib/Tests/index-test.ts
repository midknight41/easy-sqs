import easy = require("../EasySqs");
import lib = require("../index");
import sdk = require("aws-sdk");
import help = require("../Helpers/TestHelper");
import errors = require("../CustomErrors");
import interfaces = require("../Interfaces");

var gently = new (require("gently"));

var testGroup = {
  setUp: function (callback: nodeunit.ICallbackFunction): void {
    callback();
  },
  tearDown: function (callback: nodeunit.ICallbackFunction): void {
    callback();
  },
  "can create a client relying on AWS config from environment variables": function (test: nodeunit.Test): void {

    process.env.AWS_ACCESS_KEY_ID = "xxx";
    process.env.AWS_SECRET_ACCESS_KEY = "xxx";
    process.env.AWS_REGION = "eu-west-1";

    var client = lib.createClient(null);

    test.notEqual(client, null);
    test.done();
  },
  "createClient fails if environment variables aren't set up correctly": function (test: nodeunit.Test): void {

    process.env.AWS_ACCESS_KEY_ID = "xxx";
    process.env.AWS_SECRET_ACCESS_KEY = "xxx";
    process.env.AWS_REGION = "";

    test.throws(() => {

      var client = lib.createClient(null);

    }, errors.InvalidArgumentError);

    process.env.AWS_SECRET_ACCESS_KEY = "";


    test.throws(() => {

      var client = lib.createClient(null);

    }, errors.InvalidArgumentError);

    process.env.AWS_ACCESS_KEY_ID = "";

    test.throws(() => {

      var client = lib.createClient(null);

    }, errors.InvalidArgumentError);

    test.done();


  },
  "can create a client that provides AWS config as a param": function (test: nodeunit.Test): void {

    var config = {
      accessKeyId: "abc",
      secretAccessKey: "abc",
      region: "eu-west-1"
    };

    var client = lib.createClient(config);

    test.notEqual(client, null);
    test.done();
  },
  "SqsClient constructor throws on null argument": function (test: nodeunit.Test): void {

    test.throws(() => {

      var client = new lib.SqsClient(null);

    }, errors.NullOrEmptyArgumentError);
    test.done();

  },
  "createQueue throws when a null callback is passed": function (test: nodeunit.Test): void {

    var aws = gently.stub("aws-sdk", "SQS");

    var easyClient = new lib.SqsClient(aws);

    var name = "https://sqs.eu-west-1.amazonaws.com/123/queueName";
    var options: lib.ICreateQueueOptions = {};

    test.throws(() => {
      easyClient.createQueue(name, options, null);

    }, errors.NullOrEmptyArgumentError);
    test.done();

  },
  "createQueue returns an error when a null queue name is passed": function (test: nodeunit.Test): void {

    var aws = gently.stub("aws-sdk", "SQS");

    var easyClient = new lib.SqsClient(aws);

    var name = "https://sqs.eu-west-1.amazonaws.com/123/queueName";
    var options: lib.ICreateQueueOptions = {};

    easyClient.createQueue(null, options,(err, data) => {
      test.notEqual(err, null);
      test.equal(err.name, "NullOrEmptyArgumentError");
      test.done();

    });

  },
  "can create a queue": function (test: nodeunit.Test): void {

    var aws = gently.stub("aws-sdk", "SQS");

    var name = "testName";
    var options: lib.ICreateQueueOptions = {};

    gently.expect(aws, "createQueue", function (params: sdk.Sqs.CreateQueueRequest, callback: (err, data) => void) {

      var result: sdk.Sqs.CreateQueueResult = {
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
  "createQueue returns an error gracefully when AWS explodes": function (test: nodeunit.Test): void {

    var aws = gently.stub("aws-sdk", "SQS");

    var name = "testName";
    var options: lib.ICreateQueueOptions = {};

    gently.expect(aws, "createQueue", function (params: sdk.Sqs.CreateQueueRequest, callback: (err, data) => void) {


      var err = {
        message: 'The specified queue does not exist for this wsdl version.',
        code: 'AWS.SimpleQueueService.NonExistentQueue'
      };

      
      test.equal(params.QueueName, name, "queue name not set");
      test.equal(params.Attributes, options, "queue name not set");

      callback(err, null);
    });

    var easyClient = new lib.SqsClient(aws);

    easyClient.createQueue("testName", options, function (err, queue) {

      test.equal(queue, null, "queue object not returned");
      test.notEqual(err, null);
      test.done();

    });

  },
  "can get a queue (sync)": function (test: nodeunit.Test): void {

    var aws = gently.stub("aws-sdk", "SQS");

    var easyClient = new lib.SqsClient(aws);

    var queue = easyClient.getQueueSync("https://sqs.eu-west-1.amazonaws.com/123/queueName");

    test.notEqual(queue, null, "no queue reference was returned");
    test.done();

  },
  "getQueueSync does not return a queue when bad params are provided": function (test: nodeunit.Test): void {

    var aws = gently.stub("aws-sdk", "SQS");

    var easyClient = new lib.SqsClient(aws);

    var queue = easyClient.getQueueSync(null);
    test.equal(queue, null);
    test.done();

  },
  "can get a queue (async) that exists": function (test: nodeunit.Test): void {

    var aws = gently.stub("aws-sdk", "SQS");

    gently.expect(aws, "getQueueAttributes", function (params, callback: (err, data) => void) {

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
  "returns an error when the queue (async) doesn't exist": function (test: nodeunit.Test): void {

    var aws = gently.stub("aws-sdk", "SQS");

    gently.expect(aws, "getQueueAttributes", function (params, callback: (err, data) => void) {

      var err = {
        message: 'The specified queue does not exist for this wsdl version.',
        code: 'AWS.SimpleQueueService.NonExistentQueue'
      };

      callback(err, null);
    });

    var easyClient = new lib.SqsClient(aws);

    easyClient.getQueue("https://sqs.eu-west-1.amazonaws.com/123/queueName", function (err, queue) {

      var box: any = err;

      test.equal(box.code, 'AWS.SimpleQueueService.NonExistentQueue', "an unexpected error occurred");
      test.equal(queue, null, "");

      test.done();

    });

  },
  "returns an error when a null queue name is provided": function (test: nodeunit.Test): void {

    var aws = gently.stub("aws-sdk", "SQS");

    var easyClient = new lib.SqsClient(aws);

    easyClient.getQueue(null, function (err, queue) {

      var box: any = err;

      test.equal(err.name, 'NullOrEmptyArgumentError');
      test.equal(queue, null);

      test.done();

    });

  },
  "getQueue throws when a null callback is passed": function (test: nodeunit.Test): void {

    var aws = gently.stub("aws-sdk", "SQS");

    var easyClient = new lib.SqsClient(aws);

    var name = "https://sqs.eu-west-1.amazonaws.com/123/queueName";


    test.throws(() => {
      easyClient.getQueue(name, null);

    }, errors.NullOrEmptyArgumentError);
    test.done();

  }

};

exports.indexTests = testGroup;
