/// <reference path="./imports.d.ts" />
var AWS = require("aws-sdk");
var easySqs = require("./EasySqs");

function CreateClient(accessKey, secretKey, region) {
    return new SqsClient(accessKey, secretKey, region);
}
exports.CreateClient = CreateClient;

var SqsClient = (function () {
    function SqsClient(accessKey, secretKey, region) {
        if (accessKey == null || accessKey.length == 0)
            throw new Error("accessKey must be provided");
        if (secretKey == null || secretKey.length == 0)
            throw new Error("secretKey must be provided");
        if (region == null || region.length == 0)
            throw new Error("region must be provided");

        this.accessKey = accessKey;
        this.secretKey = secretKey;
        this.region = region;
    }
    SqsClient.prototype.getQueue = function (queueName) {
        var endpoint = "sqs.{0}.amazonaws.com";
        var sqs = this.configureService(new AWS.SQS(), endpoint);

        return new easySqs.Queue(queueName, sqs);
    };

    SqsClient.prototype.createQueue = function (queueName, options, callback) {
        if (queueName == null || queueName.length == 0)
            throw new Error("queueName must be provided");

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
        var endpoint = "sqs.{0}.amazonaws.com";
        var sqs = this.configureService(new AWS.SQS(), endpoint);

        var request = {
            QueueName: queueName,
            Attributes: options
        };

        console.log("calling");
        sqs.client.createQueue(request, function (err, result) {
            console.log("responding");

            if (err != null) {
                callback(err, null);
                return;
            }

            console.log(result.QueueUrl);

            var queue = new easySqs.Queue(result.QueueUrl, sqs);
            callback(null, queue);
        });
    };

    /*
    TODO
    deleteQueue
    */
    SqsClient.prototype.configureService = function (service, endpoint) {
        var creds = new AWS.Credentials(this.accessKey, this.secretKey);

        service.config.credentials = creds;
        service.config.region = this.region;

        if (endpoint != null) {
            endpoint = endpoint.replace("{0}", this.region);
            service.endpoint = new AWS.Endpoint(endpoint);
        }

        return service;
    };
    return SqsClient;
})();
exports.SqsClient = SqsClient;
//# sourceMappingURL=index.js.map
