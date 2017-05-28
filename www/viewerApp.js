angular.module('scoreBoardApp', [])
  .controller('ScoreBoardController', ['socket', function(socket) {
	var scoreBoard = this;
	scoreBoard.homeTeamName = "Home";
  scoreBoard.homeScore = 0;
	scoreBoard.visitorTeamName = "Visitor";
	scoreBoard.visitorScore = 0;
	scoreBoard.inning = 1;
	scoreBoard.isTopOfInning = true;
	scoreBoard.outs = 0;
	scoreBoard.strikes = 0;
	scoreBoard.balls = 0;
	scoreBoard.runnerOnFirst = false;
	scoreBoard.runnerOnSecond = false;
	scoreBoard.runnerOnThird = false;
	
  // Listens for messages from the server to update the board.
	socket.on('init', boardUpdate);
	socket.on('boardUpdate', boardUpdate);
	function boardUpdate(data) {
		var keys = Object.keys(data);
		for(var i = 0; i < keys.length; i++) {
			scoreBoard[keys[i]] = data[keys[i]];
		}
	}
	
  }]) // end of the controller class

  // Magic. Honestly I can't remember what this does.
  .factory('socket', function ($rootScope) {
  var socket = io.connect();
  return {
    on: function (eventName, callback) {
      socket.on(eventName, function () {  
        var args = arguments;
        $rootScope.$apply(function () {
          callback.apply(socket, args);
        });
      });
    },
    emit: function (eventName, data, callback) {
      socket.emit(eventName, data, function () {
        var args = arguments;
        $rootScope.$apply(function () {
          if (callback) {
            callback.apply(socket, args);
          }
        });
      })
    }
  };
});