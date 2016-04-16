
var express = require('express'),
	app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

// This is needed if the app is run on heroku:
var port = process.env.PORT || 8080;

app.get('/keeper', function(req, res){
  res.sendFile(__dirname + '/www/index.html');
});

app.get('/', function(req, res){
  res.sendFile(__dirname + '/www/viewer.html');
});

// Make the files in the www folder available to the world
app.use(express.static(__dirname + '/www'));

var scoreBoard = {
	homeTeamName: "Home",
    homeScore: 0,
	visitorTeamName: "Visitor",
	visitorScore: 0,
	inning: 1,
	isTopOfInning: true,
	outs: 0,
	strikes: 0,
	balls: 0
};

io.on('connection', function(socket){
	console.log('a user connected');
	socket.emit('init', scoreBoard);
	socket.on('boardUpdate', function(data){
		console.log('message: ', data);
		var keys = Object.keys(data);
		for(var i = 0; i < keys.length; i++) {
			scoreBoard[keys[i]] = data[keys[i]];
		}
		socket.broadcast.emit('boardUpdate', data);
	});
});

http.listen(port, function(){
console.log('Your application is running on http://localhost:' + port);
});