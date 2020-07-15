var express= require('express');
var app=express();
var server=require('http').Server(app);
var client = require('socket.io')(server).sockets;
var path= require('path');
var ip = require('ip');
var mongo = require('mongodb').MongoClient;

var port=8080;

mongo.connect('mongodb://localhost:27017/chatdb', function(err,db){
     if(err)
     {
         throw err;
     }
     console.log('mongo connected');
     client.on('connection',function(socket){
         console.log('A new user is connected');

         let chat = db.collection('chats');

   //create function to send status
   SendStatus=function(s){
       socket.emit('status', s);
   }

   //get chats from mongo collection
    chat.find().limit(100).sort({_id : 1}).toArray(function(err,res){
        if(err)
        {
            throw err;
        }
        socket.emit('output', res);
    })

    //handle input event
    socket.on('input', function(data){
        let name= data.name;
        let message= data.message;
        if(name==' '|| message==' '){
            SendStatus('Please enter a name and a message');
        }
        else{
            chat.insert({name: name, message: message}, function()
            {
                client.emit('output', [data]);

                SendStatus({
                    message : 'Message sent',
                    clear: true
                })
            })
        }
    });

    //handle clear
    socket.on('clear',function(data){
        //remove all chats
        chat.remove({}, function(){
            socket.emit('cleared');
        })
    })

         socket.on('disconnect', function(){
            console.log('A user is disconnected');
        })
     })
})

app.get('/', function(req,res){
    res.sendFile(__dirname + '/index.html');
})

server.listen(port,function(){
    console.log('Server listens at port http://' + ip.address() + ":" + port);
})