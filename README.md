
# easy-sqs

**easy-sqs** is a simpler wrapper for the AWS SQS service.

[![npm version](https://badge.fury.io/js/easy-sqs.svg)](http://badge.fury.io/js/easy-sqs)

## How to install

```
npm install easy-sqs

```

## How to use

```js
var easy = require("easy-sqs");


var awsConfig = {
	"accessKeyId": "[YourAccessKeyId]",
	"secretAccessKey": "[YourSecretAccessKey]",
	"region": "[YourRegion]"
};


var client = easy.createClient(awsConfig);

client.getQueue("https://sqs.eu-west-1.amazonaws.com/123/queueName", function(err, queue){

	//returns an error if the queue doesn't exist

});
```
The ```awsConfig``` parameter is optional. If the argument is not provided it will default to the AWS settings in your environment. Even if you want to have your application pass in some AWS settings (like proxy settings) you can omit the Credentials as long as they are available in your environment.

## Getting a single message

```js

queue.getMessage(function(err, msg){

	console.log(msg.Body);

});


```
## Deleting a single message

```js

queue.getMessage(function(err, msg){

	//all good, delete the message

	queue.deleteMessage(msg, function(err){

	});

});
```

## Sending a single message

```js
//messages must be strings for now...
queue.sendMessage("my message body", function(err){


});

```

## Using a QueueReader

It is common to have an application just sit and monitor a queue, process the message when it arrives, and then to continue to wait. For this activity, use a QueueReader.


```js
var queueReader = queue.createQueueReader();

queueReader.on("message", function (message, context) {

		//process msg.Body here...
		context.deleteMessage(message);

});

queueReader.on("error", function (err) {

    queueReader.stop();

});

queueReader.start();
```
Please note, the previous interface with ```onReceipt```, ```onEmpty```, and ```onError``` will be deprecated in future versions. Please modify to use standard events.
