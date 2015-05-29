
# easy-sqs

**easy-sqs** is a simple library for using AWS SQS service which provides most of the basic SQS functionality as well as providing an event emitting QueueReader with batch deletion capabilities.

[![npm version](https://badge.fury.io/js/easy-sqs.svg)](http://badge.fury.io/js/easy-sqs)
[![Build Status](https://travis-ci.org/midknight41/easy-sqs.svg?branch=master)](https://travis-ci.org/midknight41/easy-sqs)
[![Dependency Status](https://david-dm.org/midknight41/easy-sqs.png)](https://david-dm.org/midknight41/easy-sqs)
[![Coverage Status](https://coveralls.io/repos/midknight41/easy-sqs/badge.svg?branch=master)](https://coveralls.io/r/midknight41/easy-sqs?branch=master)

## How to install

```
npm install easy-sqs
```
##Getting Started

### Quick Examples

Here's some basic examples to get you started. More detailed documentation can be found further down the page [here](#docs).


#### Send a single message

To start sending message we need to get a reference to a *Queue* object. This object expose most the basic comands commands you'll need.

Here's how to send a message:

```js
var easy = require("easy-sqs");

var awsConfig = {
	"accessKeyId": "[YourAccessKeyId]",
	"secretAccessKey": "[YourSecretAccessKey]",
	"region": "[YourRegion]"
};

var url = "https://sqs.eu-west-1.amazonaws.com/123/queueName";

var client = easy.createClient(awsConfig);

client.getQueue(url, function(err, queue){

	if(err) console.log("queue does not exist");

	//messages must be strings for now...
	var msg = JSON.stringify({body: "my message body"});

	queue.sendMessage(msg, function(err){
			if(err) console.log("send failed!");
	});

});
```

#### Monitor a queue for new messages

It is common to have an application just sit and monitor a queue, process the message when it arrives, and then to continue to wait. For this activity, use a *QueueReader*.

```js
var easy = require("easy-sqs");

var awsConfig = {
	"accessKeyId": "[YourAccessKeyId]",
	"secretAccessKey": "[YourSecretAccessKey]",
	"region": "[YourRegion]"
};

var url = "https://sqs.eu-west-1.amazonaws.com/123/queueName";

var client = easy.createClient(awsConfig);
var queueReader = client.createQueueReader(url);

queueReader.on("message", function (message) {

		//process message.Body here...
		queueReader.deleteMessage(message);

});

queueReader.on("error", function (err) {

		console.log("error", err);

});

queueReader.start();
```

<a name="docs"/>
# API Documentation

There are four classes you interact with in **easy-sqs:**

- [`Client`](#client-class)
- [`Queue`](#queue-class)
- [`QueueReader`](#queue-reader-class)
- [`Message`](#message-class)

Before you can do anything with **easy-sqs** you need to configure a client with AWS configuration.

#### Create a Client object

```js
var easy = require("easy-sqs");

var awsConfig = {
	"accessKeyId": "[YourAccessKeyId]",
	"secretAccessKey": "[YourSecretAccessKey]",
	"region": "[YourRegion]"
};

var client = easy.createClient(awsConfig);
```
The ```awsConfig``` parameter is optional. This is a standard AWS client config object.

If the argument is not provided it will default to the AWS settings in your environment. Even if you want to have your application pass in some AWS settings (like proxy settings) you can omit the Credentials as long as they are available in your environment.

<a name="client-class"/>
## Client Class

The *Client* class exposes the following methods:
- [`createQueue`](#createQueue)
- [`createQueueReader`](#createClientQueueReader)
- [`getQueue`](#getQueue)
- [`getQueueSync`](#getQueueSync)

<a name="createQueue" />
#### createQueue
This method creates a new *Queue* object.

Parameters:

- **queueName** (string)
- **options** (Object)
- **callback** (err:Error, queue: Queue)

The options currently supported are:

- **DelaySeconds** (number): default = 0
- **MaximumMessageSize** (number): default = 262144
- **MessageRetentionPeriod** (number): default = 345600
- **ReceiveMessageWaitTimeSeconds** (number): default = 0
- **VisibilityTimeout** (number): default = 30

All options are optional.

##### Example
```js
var options = {
	VisibilityTimeout: 60
};

//With an option
client.createQueue("myName", options, function(err, queue){
	console.log("Queue created!");
});

//Without any options
client.createQueue("myName", null, function(err, queue){
	console.log("Queue created!");
});
```
<a name="createClientQueueReader" />
#### createQueueReader
Creates a *QueueReader* object to monitor an SQS Queue that will emit messages when they become available.

See <a>here</a> for more detail on the *QueueReader* class.

Parameters:
- **queueUrl** (string)
- **batchSize** (number): default = 10

The batchSize parameter is optional.

```js
var url = "https://sqs.eu-west-1.amazonaws.com/123/queueName";
var reader = client.createQueueReader(url, 10)
```

<a name="getQueue" />
#### getQueue
This method get a reference to an SQS Queue. The callback returns an error if the queue does not exist.

Parameters:
- **queueName** (string)
- **callback** (err:Error, queue: Queue)

```js
var url = "https://sqs.eu-west-1.amazonaws.com/123/queueName";
client.getQueue(url, function(err, queue){

});
```
<a name="getQueueSync" />
#### getQueueSync
This method is a synchronous version of the ```getQueue()``` method above. It will return a reference to a *Queue* object whether the queue exists or not.

Parameters:
- **queueUrl** (string)


```js
var url = "https://sqs.eu-west-1.amazonaws.com/123/queueName";
var queue = client.getQueueSync(url);
```

<a name="queue-class"/>
## Queue Class

A Queue object can be obtained by using either the ```getQueue()``` or ```getQueueSync()``` methods on the *Client* class.

The *Queue* class exposes the following methods:
- [`createQueueReader`](#createQueueQueueReader)
- [`getMessage`](#getMessage)
- [`deleteMessage`](#deleteMessage)
- [`sendMessage`](#sendMessage)
- [`drain`](#drain)

<a name="createQueueQueueReader"/>
#### createQueueReader
Creates a *QueueReader* object to monitor an SQS Queue that will emit messages when they become available.

See <a>here</a> for more detail on the *QueueReader* class.

Parameters:
- **batchSize** (number): default = 0

batchSize is optional.

```js
var reader = queue.createQueueReader(10);

reader.on("message", function(message){
	console.log(message.Body);
});

reader.on("error", function(error){
		console.log(error)
});

reader.start();
```

<a name="getMessage"/>
#### getMessage

Gets a single message from an SQS Queue.

Parameters:
- **callback** (err: Error, message: Message)

```js
queue.getMessage(function(err, message){

	console.log(message.Body);

});
```

<a name="deleteMessage"/>
#### deleteMessage

Once a message has been processed, it needs to be deleted from the queue. Use this method to do that.

Parameters:
- **message** (Message)

```js
queue.getMessage(function(err, message){

	//all good, delete the message

	queue.deleteMessage(message, function(err){

	});

});
```

<a name="sendMessage"/>
#### sendMessage
This method will send a message to an SQS Queue.

Parameters:
- **messageBody** (string)

```js
//messages must be strings for now...
queue.sendMessage("my message body", function(err){


});
```

<a name="drain"/>
#### drain
This method will consume and discard all messages in an SQS Queue. Useful for testing.

Parameters:
- **callback** (err: Error): This callback is optional.

```js
queue.drain(function(err){
	console.log("empty!");
});
```

<a name="queue-reader-class"/>
## QueueReader Class

It is common to have an application just sit and monitor a queue, process the message when it arrives, and then to continue to wait. For this activity, it is recommended you use a QueueReader.

The QueueReader class implements long polling and will emit a message event for every message that arrives in the queue.

Additionally, it has a built-in batch deleter that will greatly reduce the number of requests you send to AWS and, as a result, reduces the cost. The batching logic is very pessimistic and will not hold an outstanding delete request for more than a couple seconds.

If you do not want to use batch deletions then just set the batchSize = 1 when you create the QueueReader.

The *QueueReader* class exposes the following methods:
- [`start`](#start)
- [`stop`](#stop)
- [`pause`](#pause)
- [`deleteMessage`](#deleteMessageBatch)
- [`deleteMessages`](#deleteMessagesBatch)

It also emits the following events:
- [`message`](#eventMessage)
- [`error`](#eventError)
- [`empty`](#eventEmpty)
- [`started`](#eventStarted)
- [`stopped`](#eventStopped)

```js
var queueReader = queue.createQueueReader();

queueReader.on("message", function (message) {

		//process msg.Body here...
		queueReader.deleteMessage(message);

});

queueReader.on("error", function (err) {

		console.log("error", err);

});

queueReader.start();
```

### QueueReader methods

<a name="start"/>
#### start
Starts long polling of an SQS queue. Emits a ```started``` event when it begins polling.

<a name="stop"/>
#### stop
Stops long polling of an SQS queue. This method will emit a ```stopped``` event after any outstanding messages are emitted and deleted.  

<a name="pause"/>
#### pause
This behaves exactly the same as ```stop()``` but does not emit a ```stopped``` event.

<a name="deleteMessageBatch"/>
#### deleteMessage
This method adds a message to a deletion batch. If the number of messages exceed the batch size a batch deletion is sent to the Sqs Queue.

Please note: This behaviour is **not the same** as ```Queue.deleteMessage()```.

Parameters:
- **message** (Message)

```js
var queueReader = queue.createQueueReader();

queueReader.on("message", function (message) {

		//process msg.Body here...
		queueReader.deleteMessage(message);

});
```

<a name="deleteMessagesBatch"/>
#### deleteMessages
Behaves the same as above but takes an array of messages as it's input.

Parameters:
- **messages** (Message[])

### QueueReader events

<a name="eventMessage"/>
#### on("message")
The message event is emitted for every message that is pulled from the queue.

```js
queueReader.on("message", function (message) {
	//process msg.Body here...
});
```

<a name="eventError"/>
#### on("error")
Any errors that occur are emitted by the error event.

```js
queueReader.on("error", function (err) {
	console.log("whoops", err);
});
```

<a name="eventEmpty"/>
#### on("empty")
The empty is emitted any time the long polling does not return any messages.

```js
queueReader.on("empty", function () {
	console.log("The queue is empty!");
});
```
<a name="eventStarted"/>
#### on("started")
The started event is emitted when the long polling loop commences.
```js
queueReader.on("started", function () {
	console.log("start polling");
});
```

<a name="eventStopped"/>
#### on("stopped")
The stopped event will be emitted after the ```stop()``` method  is called and once all messages which are currently in memory have been emitted and deleted.  
```js
queueReader.on("stopped", function () {
	console.log("stopped");
});
```

<a name="message-class"/>
## Message Class

The *Message* class is the same class provided by the aws-sdk. Documentation for it can be found [here](http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SQS.html).

##Deprecation Notice

The previous interface with ```onReceipt```, ```onEmpty```, and ```onError``` will be deprecated in future versions. If you are using an older version of this library, please modify to use standard events.
