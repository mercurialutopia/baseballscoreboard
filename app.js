// Server portion of the app

var express = require('express'),
	app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

// This is needed if the app is run on heroku:
var port = process.env.PORT || 8080;

// Direct requests to the app with /keeper appended to the Scorekeeper UI.
app.get('/keeper', function(req, res){
  res.sendFile(__dirname + '/www/index.html');
});

// Direct requests to the root of the app to the Viewer UI.
app.get('/', function(req, res){
  res.sendFile(__dirname + '/www/viewer.html');
});

// Make the files in the www folder available to the world
app.use(express.static(__dirname + '/www'));

// keeps the state of the scoreboad to send to a viewer if they are joining late.
var scoreBoard = {
	homeTeamName: "Home",
    homeScore: 0,
	visitorTeamName: "Visitor",
	visitorScore: 0,
	inning: 1,
	isTopOfInning: true,
	outs: 0,
	strikes: 0,
	balls: 0,
	runnerOnFirst: false,
	runnerOnSecond: false,
	runnerOnThird: false
};

// Listens for a new user connecting to the websockets.
io.on('connection', function(socket){
	console.log('a user connected');
	// send the current board state
	socket.emit('init', scoreBoard);
	// listen for updated from the Scorekeeper.
	socket.on('boardUpdate', function(data){
		console.log('message: ', data);
		var keys = Object.keys(data);
		// Update the server's copy of the scoreboard.
		for(var i = 0; i < keys.length; i++) {
			scoreBoard[keys[i]] = data[keys[i]];
		}
		// Send a update message to all Viewers
		socket.broadcast.emit('boardUpdate', data);
	});
});

// Starts the websocket listener.
http.listen(port, function(){
console.log('Your application is running on http://localhost:' + port);
});