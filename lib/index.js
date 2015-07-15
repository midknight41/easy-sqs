var AWS = require("aws-sdk");
var easySqs = require("./EasySqs");
var errors = require("./CustomErrors");
function createClient(sqsConfig, awsConfig) {

    if (awsConfig != null) {
        AWS.config.update(awsConfig);
    }
    return new SqsClient(new AWS.SQS(sqsConfig));
}
exports.createClient = createClient;

//deprecated
function CreateClient(accessKey, secretKey, region) {
    console.warn("CreateClient is now deprecated. Please use createClient instead");
    var service = configureService(accessKey, secretKey, region);
    return new SqsClient(service);
}
exports.CreateClient = CreateClient;
//deprecated
function configureService(accessKey, secretKey, region) {
    var creds = new AWS.Credentials(accessKey, secretKey);
    var endpoint = "sqs.{0}.amazonaws.com";
    var service = new AWS.SQS();
    service.config.credentials = creds;
    service.config.region = region;
    endpoint = endpoint.replace("{0}", region);
    service.endpoint = new AWS.Endpoint(endpoint);
    return service;
}
var SqsClient = (function () {
    function SqsClient(service) {
        if (service == null)
            throw new errors.NullOrEmptyArgumentError("AWS SQS service must be provided");
        this.sqs = service;
    }
    SqsClient.prototype.getQueueSync = function (queueUrl) {
        //Should I throw here?
        if (queueUrl == null || queueUrl.length == 0) {
            return null;
        }
        var client = this.sqs;
        return new easySqs.Queue(queueUrl, client);
    };
    SqsClient.prototype.getQueue = function (queueUrl, callback) {
        if (callback == null)
            throw new errors.NullOrEmptyArgumentError("callback must be provided");
        if (queueUrl == null || queueUrl.length == 0) {
            callback(new errors.NullOrEmptyArgumentError("queueName must be provided"), null);
            return;
        }
        var client = this.sqs;
        var request = {
            QueueUrl: queueUrl
        };
        client.getQueueAttributes(request, function (err, result) {
            if (err != null) {
                callback(err, null);
                return;
            }
            var queue = new easySqs.Queue(queueUrl, client);
            callback(null, queue);
        });
    };
    SqsClient.prototype.createQueue = function (queueName, options, callback) {
        if (callback == null)
            throw new errors.NullOrEmptyArgumentError("callback must be provided");
        if (queueName == null || queueName.length == 0) {
            callback(new errors.NullOrEmptyArgumentError("queueName must be provided"), null);
            return;
        }
        /*
        
        if (options == null) options = {};
        if (options.DelaySeconds == null) options.DelaySeconds = 0;
        if (options.MaximumMessageSize == null) options.MaximumMessageSize = 0;
        if (options.MessageRetentionPeriod == null) options.MessageRetentionPeriod = 0;
        if (options.ReceiveMessageWaitTimeSeconds == null) options.ReceiveMessageWaitTimeSeconds = 0;
        if (options.VisibilityTimeout == null) options.VisibilityTimeout = 0;
    
        DelaySeconds?: number; //0
        MaximumMessageSize?: number; //262144
        MessageRetentionPeriod?: number; //345600
        ReceiveMessageWaitTimeSeconds?: number; //0
        VisibilityTimeout?: number; //30
    
      */
        var client = this.sqs;
        var request = {
            QueueName: queueName,
            Attributes: options
        };
        client.createQueue(request, function (err, result) {
            if (err != null) {
                callback(err, null);
                return;
            }
            var queue = new easySqs.Queue(result.QueueUrl, client);
            callback(null, queue);
        });
    };
    SqsClient.prototype.createQueueReader = function (queueUrl, batchSize) {
        var queue = this.getQueueSync(queueUrl);
        return queue.createQueueReader(batchSize);
    };
    return SqsClient;
})();
exports.SqsClient = SqsClient;
//# sourceMappingURL=index.js.map
