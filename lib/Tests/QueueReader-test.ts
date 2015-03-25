import readers = require("../QueueReader");
import sdk = require("aws-sdk");
import help = require("../Helpers/TestHelper");
import errors = require("../CustomErrors");
import events = require("events");

var gently = new (require("gently"));

var messages: sdk.Sqs.Message[] = [
  {
    MessageId: "1234",
    Body: "{msg: 'test'}",
    ReceiptHandle: "423421",
    MD5OfBody: "MD55",
    Attributes: []
  }
];

var testGroup = {
  setUp: function (callback: nodeunit.ICallbackFunction): void {
    callback();
  },
  tearDown: function (callback: nodeunit.ICallbackFunction): void {
    callback();
  },
  "correctly construct a QueueReader": function (test: nodeunit.Test): void {

    var aws = gently.stub("aws-sdk", "SQS");

    var reader = new readers.QueueReader(aws, "name");


    test.done();
  },
  "can recieve a message": function (test: nodeunit.Test): void {

    var aws = gently.stub("aws-sdk", "SQS");

    var reader = new readers.QueueReader(aws, "name");

    gently.expect(aws, "receiveMessage",(params, cb) => {

      var data = { Messages: messages };

      cb(null, data);
    });

    reader.on("message",(msg, deleter) => {

      reader.stop();
      test.equal(msg, messages[0]);

      test.done();

    });

    reader.start();

  },
  "can receive an empty signal": function (test: nodeunit.Test): void {
    var aws = gently.stub("aws-sdk", "SQS");

    var reader = new readers.QueueReader(aws, "name");

    gently.expect(aws, "receiveMessage",(params, cb) => {
      var data = { Messages: null };

      cb(null, data);
    });

    reader.on("empty",(err) => {

      reader.stop();

      test.done();

    });

    reader.start();
  },
  "can emit an error when it happens": function (test: nodeunit.Test): void {
    var aws = gently.stub("aws-sdk", "SQS");

    var reader = new readers.QueueReader(aws, "name");
    var error = new Error("my error");

    gently.expect(aws, "receiveMessage",(params, cb) => {
      var data = { Messages: null };

      cb(error, null);
    });

    reader.on("error",(err) => {

      reader.stop();

      test.equal(err, error);
      test.done();

    });

    reader.start();
  },
  "throws error when no queue name is provided": function (test: nodeunit.Test): void {
    var aws = gently.stub("aws-sdk", "SQS");

    test.throws(() => {
      var reader = new readers.QueueReader(aws, null);
    }, errors.NullOrEmptyArgumentError);

    test.throws(() => {
      var reader = new readers.QueueReader(aws, "");
    }, errors.InvalidArgumentError);

    test.done();
  },
  "throws error is not aws param is provided": function (test: nodeunit.Test): void {

    test.throws(() => {
      var reader = new readers.QueueReader(null, "name");
    }, errors.NullOrEmptyArgumentError);

    test.done();
  },
  "throws error if batchSize is < 0": function (test: nodeunit.Test): void {
    var aws = gently.stub("aws-sdk", "SQS");

    test.throws(() => {
      var reader = new readers.QueueReader(aws, "name", -1);
    }, errors.InvalidArgumentError);

    test.done();
  },
  "batchSize defaults to 10 if it isn't provided": function (test: nodeunit.Test): void {
    var aws = gently.stub("aws-sdk", "SQS");

    var reader = new readers.QueueReader(aws, "name");
    test.equal(reader.batchSize, 10)
    test.done();
  },
  "batchSize is set properly if it's provided": function (test: nodeunit.Test): void {
    var aws = gently.stub("aws-sdk", "SQS");

    var reader = new readers.QueueReader(aws, "name");
    test.equal(reader.batchSize, 10)
    test.done();
  }

};

exports.QueueReaderTests = testGroup;