/// <reference path="./imports.d.ts" />

import AWS = require("aws-sdk");
import easySqs = require("./EasySqs");

export function CreateClient(accessKey: string, secretKey: string, region: string) {
  return new SqsClient(accessKey, secretKey, region);
}

export interface ISqsClient {
  getQueue(queueName: string): easySqs.IQueue;
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

  getQueue(queueName: string): easySqs.IQueue {

    var sqs = this.configureService(new AWS.SQS());

    return new easySqs.Queue(queueName, sqs);
  }
  
  /*
  TODO
  createQueue
  deleteQueue
*/

  private configureService(service: any) {
    var creds = new AWS.Credentials(this.accessKey, this.secretKey);

    service.client.config.credentials = creds;
    service.client.config.region = this.region;

    return service;

  }
}
