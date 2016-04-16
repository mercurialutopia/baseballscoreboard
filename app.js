
var express = require('express'),
	app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

// This is needed if the app is run on heroku:
var port = process.env.PORT || 8080;

app.get('/', function(req, res){
  res.sendFile(__dirname + '/www/index.html');
});
// Make the files in the www folder available to the world
app.use(express.static(__dirname + '/www'));

io.on('connection', function(socket){
  console.log('a user connected');
  socket.on('boardUpdate', function(msg){
    console.log('message: ', msg);
  });
});

http.listen(port, function(){
console.log('Your application is running on http://localhost:' + port);
});