/// <reference path="./imports.d.ts" />

import AWS = require("aws-sdk");
import easySqs = require("./EasySqs");

export function CreateClient(accessKey: string, secretKey: string, region: string): ISqsClient {

  var service = configureService(accessKey, secretKey, region);

  return new SqsClient(service);
}

function configureService(accessKey, secretKey, region): AWS.SQS {

  var creds = new AWS.Credentials(accessKey, secretKey);

  var endpoint = "sqs.{0}.amazonaws.com";
  var service: AWS.SQS = new AWS.SQS();

  service.config.credentials = creds;
  service.config.region = region;

  endpoint = endpoint.replace("{0}", region);
  service.endpoint = new AWS.Endpoint(endpoint);

  return service;

}

export interface ISqsClient {
  getQueue(queueUrl: string, callback: (err: Error, queue: easySqs.Queue) => void);
  createQueue(queueName: string, options: ICreateQueueOptions, callback: (err: Error, queue: easySqs.IQueue) => void);
}

export interface ICreateQueueOptions {
  DelaySeconds?: number; //0
  MaximumMessageSize?: number; //262144
  MessageRetentionPeriod?: number; //345600
  ReceiveMessageWaitTimeSeconds?: number; //0
  VisibilityTimeout?: number; //30
}

export class SqsClient implements ISqsClient {
  private accessKey: string;
  private secretKey: string;
  private region: string;
  private sqs: AWS.SQS;

  constructor(service: AWS.SQS) {
    if (service == null) throw new Error("AWS SQS service must be provided");
    this.sqs = service;
  }

  public getQueue(queueUrl: string, callback: (err: Error, queue: easySqs.Queue) => void) {

    if (callback == null) throw new Error("callback must be provided");

    if (queueUrl == null || queueUrl.length == 0) {
      callback(new Error("queueName must be provided"), null);
      return;
    }

    var client = this.sqs;

    var request: AWS.Sqs.GetQueueAttributesRequest = {
      QueueUrl: queueUrl
    };

    client.getQueueAttributes(request, function (err: Error, result: AWS.Sqs.GetQueueAttributesResult) {

      if (err != null) {
        callback(err, null);
        return;
      }

      var queue = new easySqs.Queue(queueUrl, client);
      callback(null, queue);

    });

  }

  public createQueue(queueName: string, options: ICreateQueueOptions, callback: (err: Error, queue: easySqs.IQueue) => void) {

    if (callback == null) throw new Error("callback must be provided");

    if (queueName == null || queueName.length == 0) {
      callback(new Error("queueName must be provided"), null);
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

    var request: AWS.Sqs.CreateQueueRequest = {
      QueueName: queueName,
      Attributes: options
    };

    client.createQueue(request, function (err: Error, result: AWS.Sqs.CreateQueueResult) {

      if (err != null) {
        callback(err, null);
        return;
      }

      var queue = new easySqs.Queue(result.QueueUrl, client);
      callback(null, queue);

    });
  }


  /*
  TODO
  deleteQueue
*/

}
