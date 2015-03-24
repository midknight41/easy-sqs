//declare module "easy-sqs" {

//  export function CreateClient(accessKey: string, secretKey: string, region: string): ISqsClient;
//  export interface ISqsClient {
//    getQueue(queueUrl: string, callback: (err: Error, queue: IQueue) => void): any;
//    createQueue(queueName: string, options: ICreateQueueOptions, callback: (err: Error, queue: IQueue) => void): any;
//  }
//  export interface ICreateQueueOptions {
//    DelaySeconds?: number;
//    MaximumMessageSize?: number;
//    MessageRetentionPeriod?: number;
//    ReceiveMessageWaitTimeSeconds?: number;
//    VisibilityTimeout?: number;
//  }
//  export class SqsClient implements ISqsClient {
//    private accessKey;
//    private secretKey;
//    private region;
//    private sqs;
//    constructor(service: AWS.SQS);
//    public getQueue(queueUrl: string, callback: (err: Error, queue: IQueue) => void): void;
//    public createQueue(queueName: string, options: ICreateQueueOptions, callback: (err: Error, queue: IQueue) => void): void;
//  }


//  export interface IQueueReader {
//    onReceipt(callback: (err: any, messages: AWS.Sqs.Message[], context: IMessageDeleter) => void): any;
//    onEmpty(callback: (err: any) => void): any;
//    start(): any;
//    stop(): any;
//    receiptCallback: (err: Error, messages: AWS.Sqs.Message[], context: IMessageDeleter) => void;
//    emptyCallback: (err: Error) => void;
//    errorHandler: (err: Error) => void;
//  }
//  export interface IMessageDeleter {
//    deleteMessage(message: AWS.Sqs.Message): any;
//    deleteMessages(messages: AWS.Sqs.Message[]): any;
//  }
//  export class QueueReader implements IQueueReader {
//    public receiptCallback: (err: Error, messages: AWS.Sqs.Message[], context: IMessageDeleter) => void;
//    public emptyCallback: (err: Error) => void;
//    public errorHandler: (err: Error) => void;
//    private sqs;
//    private queueName;
//    public batchSize: number;
//    private listening;
//    constructor(sqs: AWS.SQS, queueName: string, batchSize?: number);
//    public onReceipt(callback: (err: Error, messages: AWS.Sqs.Message[], context: IMessageDeleter) => void): IQueueReader;
//    public onEmpty(callback: (err: Error) => void): IQueueReader;
//    public onError(callback: (err: Error) => void): IQueueReader;
//    public start(): void;
//    private checkEventsAreSetupCorrectly();
//    public stop(): void;
//    private internalMonitorQueue(deleter);
//  }
//  export class MessageDeleter implements IMessageDeleter {
//    private recieptLog;
//    private threshold;
//    private queueName;
//    private sqs;
//    private errorHandler;
//    constructor(sqs: AWS.SQS, queueName: string, batchSize: number, errorHandler: (err: Error) => void);
//    public deleteMessage(message: AWS.Sqs.Message): void;
//    public deleteMessages(messages: AWS.Sqs.Message[]): void;
//    private flushIfThresholdExceeded();
//    public flush(): void;
//    private cleanUp(client, parent);
//    private deleteMessageBatch(client, queueName, handles);
//  }

//  export interface IQueue {
//    queueName: string;
//    getMessage(callback: (err: Error, data: AWS.Sqs.Message) => void): any;
//    deleteMessage(msg: AWS.Sqs.Message, callback: (err: Error) => void): any;
//    sendMessage(data: string, callback: (err: Error) => void): any;
//    createQueueReader(): IQueueReader;
//    drain(callback?: (err: Error) => void): any;
//  }
//  export class Queue implements IQueue {
//    public queueName: string;
//    private sqs;
//    constructor(queueName: string, sqs: AWS.SQS);
//    public createQueueReader(): IQueueReader;
//    public drain(callback?: (err: Error) => void): void;
//    public getMessage(callback: (err: Error, data: AWS.Sqs.Message) => void): void;
//    public deleteMessage(msg: AWS.Sqs.Message, callback: (err: Error) => void): void;
//    public sendMessage(data: string, callback: (err: Error) => void): void;
//  }
//}
