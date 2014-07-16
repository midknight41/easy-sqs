/// <reference path="./imports.d.ts" />

import AWS = require("aws-sdk");
import easySqs = require("./EasySqs");

export function CreateClient(accessKey: string, secretKey: string, region: string) {
  return new SqsClient(accessKey, secretKey, region);
}

export interface ISqsClient {
  getQueue(queueName: string): easySqs.IQueue;
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

  constructor(accessKey: string, secretKey: string, region: string) {

    if (accessKey == null || accessKey.length == 0) throw new Error("accessKey must be provided");
    if (secretKey == null || secretKey.length == 0) throw new Error("secretKey must be provided");
    if (region == null || region.length == 0) throw new Error("region must be provided");

    this.accessKey = accessKey;
    this.secretKey = secretKey;
    this.region = region;
  }

  public getQueue(queueName: string): easySqs.IQueue {
    var endpoint = "sqs.{0}.amazonaws.com";
    var sqs: AWS.SQS = this.configureService(new AWS.SQS(), endpoint);

    return new easySqs.Queue(queueName, sqs);
  }

  public createQueue(queueName: string, options: ICreateQueueOptions, callback: (err: Error, queue: easySqs.IQueue) => void) {

    if (queueName == null || queueName.length == 0) throw new Error("queueName must be provided");

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
    var sqs: AWS.SQS = this.configureService(new AWS.SQS(), endpoint);
    var client = sqs;

    var request: AWS.Sqs.CreateQueueRequest = {
      QueueName: queueName,
      Attributes: options
    }

    console.log("calling");
    client.createQueue(request, function (err: Error, result: AWS.Sqs.CreateQueueResult) {

      console.log("responding");

      if (err != null) {
        callback(err, null);
        return;
      }

      console.log(result.QueueUrl);

      var queue = new easySqs.Queue(result.QueueUrl, sqs);
      callback(null, queue);

    });
  }

  
  /*
  TODO
  deleteQueue
*/

  private configureService(service: AWS.SQS, endpoint?: string): AWS.SQS {
    var creds = new AWS.Credentials(this.accessKey, this.secretKey);

    service.config.credentials = creds;
    service.config.region = this.region;

    if (endpoint != null) {
      endpoint = endpoint.replace("{0}", this.region);
      service.endpoint = new AWS.Endpoint(endpoint);
    }

    return service;

  }
}
