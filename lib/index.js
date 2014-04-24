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
        var sqs = this.configureService(new AWS.SQS());

        return new easySqs.Queue(queueName, sqs);
    };

    /*
    TODO
    createQueue
    deleteQueue
    */
    SqsClient.prototype.configureService = function (service) {
        var creds = new AWS.Credentials(this.accessKey, this.secretKey);

        service.client.config.credentials = creds;
        service.client.config.region = this.region;

        return service;
    };
    return SqsClient;
})();
exports.SqsClient = SqsClient;
//# sourceMappingURL=index.js.map
