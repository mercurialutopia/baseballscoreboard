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
	
    function setBSO(strikes, balls, outs) {
		var changeInning = false;
		if(balls == 4) { // if there are 4 balls then the player has been walked, reset the count
			balls = 0;
			strikes = 0;
		} else if(balls < 0) // there can be no fewer than zero balls, set to zero instead
			balls = 0;
		if(strikes == 3) { // if there are 3 strikes then the player is out, reset the count and add an out
			balls = 0;
			strikes = 0;
			outs += 1;
		} else if(strikes < 0) // there can be no fewer than zero strikes, set to zero instead
			strikes = 0;
		if(outs == 3) { // if there are three outs then the inning half is over, reset the count and outs and go to the next inning
			balls = 0;
			strikes = 0;
			outs = 0;
			changeInning = true;
		} else if(outs < 0) // there can be no fewer than zero outs, set to zero instead
			outs = 0;
		// if the outs, strikes, or balls has changed, save the changes.
		if(scoreBoard.outs != outs || scoreBoard.strikes != strikes || scoreBoard.balls != balls) {
			if(changeInning) { // changing the inning will create a snapshot, so only create a snapshot here if not changing the inning
				scoreBoard.nextHalfInning();
			}
			scoreBoard.outs = outs;
			scoreBoard.strikes = strikes;
			scoreBoard.balls = balls;
		}
	}
    
	function setHomeScore(score) {
		if(score >= 0) { // teams may not have a score below zero
			scoreBoard.homeScore = score;
		}
	}
	
	function setVisitorScore(score) {
		if(score >= 0) { // teams may not have a score below zero
			scoreBoard.visitorScore = score;
		}
	}
	
	function setInning(inning, isTop) {
		if(inning > 0) { // the inning must be at least the first (1)
			scoreBoard.inning = inning;
			scoreBoard.isTopOfInning = isTop;
		}
	}
	
	socket.on('init', boardUpdate);
	socket.on('boardUpdate', boardUpdate);
	function boardUpdate(data) {
		var keys = Object.keys(data);
		for(var i = 0; i < keys.length; i++) {
			scoreBoard[keys[i]] = data[keys[i]];
		}
	}
	
  }])
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