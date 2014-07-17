##Easy SQS

Simple wrapper for SQS

##How to install

```

npm install easy-sqs

```

##How to use

```
var easy = require("easy-sqs");

var client = easy.CreateClient("yourAccessKey", "yourSecretKey", "eu-west-1");

var q = client.getQueue("yourQueueName");


```

##Getting a single message

```

q.getMessage(function(err, msg){

	console.log(msg.Body);

});


```

##Deleting a single message

```

q.getMessage(function(err, msg){

	//all good, delete the message

	q.deleteMessage(msg, function(err){

	});

});


```

##Sending a single message

```

q.sendMessage('{"some": "data"}', function(err){


});


```

##Using a queue reader

It is common to have an application just sit and monitor a queue, process the message when it arrives, and then to continue to wait. For this activity, use a QueueReader.


```

var queueReader = q.createQueueReader();

queueReader.onReceipt(function (err, messages, context) {


	messages.forEach(function(msg){

		//process msg.Body

		context.deleteMessage(msg);

	});

});

queueReader.onEmpty(function (err) {

    queueReader.stop();

});

queueReader.start();




```