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
	scoreBoard.correctionModeOn = false;
	scoreBoard.history = [];
	scoreBoard.historyOn = true;
	scoreBoard.nameEdit = {
		homeTeamName: scoreBoard.homeTeamName,
		visitorTeamName: scoreBoard.visitorTeamName
	};
	scoreBoard.runnerOnFirst = false;
	scoreBoard.runnerOnSecond = false;
	scoreBoard.runnerOnThird = false;

	// This is used for server keep alive. Messages over web sockets don't appear to count as traffic in heroku so it was hitting the sleep timer on the free instance and resetting the scoreboard.
	setInterval(function() { jQuery.ajax(window.location.href); }, 1200000); // 1200000 ms = 20 minutes

  // On mobile, auto close the menu after making a selection.
	$('.nav a').on('click', function(){
    $('.btn-navbar').click(); //bootstrap 2.x
    $('.navbar-toggle').click() //bootstrap 3.x by Richard
	});
	
	// This stores a backup copy of all of the settings on the board. For use with undo.
	function snapshotState() {
		// generally history is always saved. This flag is used primarily when starting a new game.
		if(scoreBoard.historyOn) {
			// create a new state object containing all of the current values, and store it in the history
			var state = {};
			state.homeTeamName = scoreBoard.homeTeamName;
			state.homeScore = scoreBoard.homeScore;
			state.visitorScore = scoreBoard.visitorScore;
			state.visitorTeamName = scoreBoard.visitorTeamName;
			state.inning = scoreBoard.inning;
			state.isTopOfInning = scoreBoard.isTopOfInning;
			state.outs = scoreBoard.outs;
			state.strikes = scoreBoard.strikes;
			state.balls = scoreBoard.balls;
			state.runnerOnFirst = scoreBoard.runnerOnFirst;
			state.runnerOnSecond = scoreBoard.runnerOnSecond;
			state.runnerOnThird = scoreBoard.runnerOnThird;
			scoreBoard.history.push(state);
			// if there are more than 5 previous states in the history, remove the oldest one
			if(scoreBoard.history.length > 5)
				scoreBoard.history.shift();
		}
	}
	
	// This is used by the UI to perform the Undo action. This pulls the last saved state and updates the board to those values.
	scoreBoard.revertState = function() {
		if(scoreBoard.history.length > 0) { // if there is a previous state
			//pull the previous state and set all values
			var state = scoreBoard.history.pop();
			scoreBoard.homeTeamName = state.homeTeamName;
			scoreBoard.homeScore = state.homeScore;
			scoreBoard.visitorTeamName = state.visitorTeamName;
			scoreBoard.visitorScore = state.visitorScore;
			scoreBoard.inning = state.inning;
			scoreBoard.isTopOfInning = state.isTopOfInning;
			scoreBoard.outs = state.outs;
			scoreBoard.strikes = state.strikes;
			scoreBoard.balls = state.balls;
			scoreBoard.runnerOnFirst = state.runnerOnFirst;
			scoreBoard.runnerOnSecond = state.runnerOnSecond;
			scoreBoard.runnerOnThird = state.runnerOnThird;
			socket.emit('boardUpdate', state);
		}
	}
 
	// All changes to strikes, balls and outs are related. When any changes need to be made to these fields, use this method. 
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
			else {
				snapshotState();
			}
			scoreBoard.outs = outs;
			scoreBoard.strikes = strikes;
			scoreBoard.balls = balls;
			var update = { balls: balls, strikes: strikes, outs: outs };
			socket.emit('boardUpdate', update);
		}
	}

	//used by the UI when adding a strike.
	scoreBoard.addStrike = function() {
		setBSO(1+scoreBoard.strikes, scoreBoard.balls, scoreBoard.outs);
	};
	//used by the UI when removing a strike.
	scoreBoard.removeStrike = function() {
		setBSO(scoreBoard.strikes-1, scoreBoard.balls, scoreBoard.outs);
	};
	//used by the UI when adding a ball.
	scoreBoard.addBall = function() {
		setBSO(scoreBoard.strikes, 1+scoreBoard.balls, scoreBoard.outs);
	};
	//used by the UI when removing a ball.
	scoreBoard.removeBall = function() {
		setBSO(scoreBoard.strikes, scoreBoard.balls-1, scoreBoard.outs);
	};
	//used by the UI when adding an out.
	scoreBoard.addOut = function() {
		setBSO(scoreBoard.strikes, scoreBoard.balls, 1+scoreBoard.outs);
	};
	//used by the UI when removing an out.
	scoreBoard.removeOut = function() {
		setBSO(scoreBoard.strikes, scoreBoard.balls, scoreBoard.outs-1);
	};
	// Used to clear the count.
	scoreBoard.newBatter = function() {
	// a new batter clears the count, but does not effect the outs
		setBSO(0, 0, scoreBoard.outs);
	};


	// Updates the home score.
	function setHomeScore(score) {
		if(score >= 0) { // teams may not have a score below zero
			snapshotState();
			scoreBoard.homeScore = score;
			var update = { homeScore: score };
			socket.emit('boardUpdate', update);
		}
	}
	// Used by the UI when adding a run for the home team.
	scoreBoard.addRunHome = function() {
		setHomeScore(1+scoreBoard.homeScore);
	};
	// Used by the UI when removing a run for the home team.
	scoreBoard.removeRunHome = function() {
		setHomeScore(scoreBoard.homeScore-1);
	};


	// Updates the home score.
	function setVisitorScore(score) {
		if(score >= 0) { // teams may not have a score below zero
			snapshotState();
			scoreBoard.visitorScore = score;
			var update = { visitorScore: score };
			socket.emit('boardUpdate', update);
		}
	}
	// Used by the UI when adding a run for the visitor team.
	scoreBoard.addRunVisitor = function() {
		setVisitorScore(1+scoreBoard.visitorScore);
	};
  // Used by the UI when removing a run for the visitor team.
	scoreBoard.removeRunVisitor = function() {
		setVisitorScore(scoreBoard.visitorScore-1);
	};


  // Updates the inning
	function setInning(inning, isTop) {
		if(inning > 0) { // the inning must be at least the first (1)
			snapshotState();
			scoreBoard.inning = inning;
			scoreBoard.isTopOfInning = isTop;
			scoreBoard.runnerOnFirst = false;
			scoreBoard.runnerOnSecond = false;
			scoreBoard.runnerOnThird = false;
			
			var update = { inning: inning, isTopOfInning: isTop, runnerOnFirst: false, runnerOnSecond: false, runnerOnThird: false };
			socket.emit('boardUpdate', update);
		}
	}
	// Used by the UI when advancing the inning
	scoreBoard.nextHalfInning = function() {
		// if it is currently the top of the inning then it will become the bottom of the same inning
		if(scoreBoard.isTopOfInning) {
			setInning(scoreBoard.inning, false);
		} else { // if it is the bottom of the inning then is will become the top of the next inning
			setInning(1+scoreBoard.inning, true);
		}
	}
	// Used by the UI when correcting the inning
	scoreBoard.previousHalfInning = function() {
		//if it is currently the top of the inning then it will become the bottom of the previous inning
		if(scoreBoard.isTopOfInning) {
			setInning(scoreBoard.inning-1, false);
		} else { // if it is the bottom of the inning then is will become the top of the same inning
			setInning(scoreBoard.inning, true);
		}
	};


	// Used by the UI when toggling the runner on base state. Called with 1, 2, or 3. 
	scoreBoard.runnerOn = function(base) {
		switch(base) {
			case 1:
				scoreBoard.runnerOnFirst = !scoreBoard.runnerOnFirst;
				var update = { runnerOnFirst: scoreBoard.runnerOnFirst };
				socket.emit('boardUpdate', update);
				break;
			case 2:
				scoreBoard.runnerOnSecond = !scoreBoard.runnerOnSecond;
				var update = { runnerOnSecond: scoreBoard.runnerOnSecond };
				socket.emit('boardUpdate', update);
				break;
			case 3:
				scoreBoard.runnerOnThird = !scoreBoard.runnerOnThird;
				var update = { runnerOnThird: scoreBoard.runnerOnThird };
				socket.emit('boardUpdate', update);
				break;
		}
	};


	// Turns the correction mode on and off.
	function setCorrectionMode(correctionModeOn) {
		scoreBoard.correctionModeOn = correctionModeOn;
	}
	// Used by the UI to toggle the correction mode.
	scoreBoard.toggleCorrectionMode = function() {
		setCorrectionMode(!scoreBoard.correctionModeOn);
	};
	// Used by the UI to see if correction mode is on.
	scoreBoard.isCorrectionMode = function() {
		return scoreBoard.correctionModeOn;
	};


  // Used by the UI to clears the board in preparation for a new game.
	scoreBoard.newGame = function() {
		var confirmNewGame = confirm("Are you sure you want to clear the current game?");
		if(confirmNewGame) {
			// reset the history
			delete scoreBoard.history;
			scoreBoard.history = [];
			// store the previous game in the new history before clearing it
			snapshotState(); 
			//turn off snapshots so that the previous game is not flooded from the history
			scoreBoard.historyOn = false;
		
			// a new game starts at the top of the first inning
			setInning(1, true);
			// a new game starts with the scores for both teams at zero
			setHomeScore(0);
			setVisitorScore(0);
			// a new game starts with a cleared count, and no outs
			setBSO(0,0,0);
			// don't start a game in correction mode
			setCorrectionMode(false);
			saveTeamNames("Home", "Visitor");

			scoreBoard.runnerOnFirst = false;
			scoreBoard.runnerOnSecond = false;
			scoreBoard.runnerOnThird = false;
			
			// the game is reset, turn the history back on
			scoreBoard.historyOn = true;
		}
	};
	

	// Used by the UI when starting the edit of the name of the Teams.
	scoreBoard.editNames = function() {
		scoreBoard.nameEdit.homeTeamName = scoreBoard.homeTeamName;
		scoreBoard.nameEdit.visitorTeamName = scoreBoard.visitorTeamName;
	};
	// Used by the UI when saving the new team names.
	scoreBoard.saveNames = function() {
		saveTeamNames(scoreBoard.nameEdit.homeTeamName, scoreBoard.nameEdit.visitorTeamName);
	};
	// Changes the team names.
	function saveTeamNames(homeTeamName, visitorTeamName) {
		scoreBoard.homeTeamName = homeTeamName;
		scoreBoard.visitorTeamName = visitorTeamName;
		var update = { homeTeamName: homeTeamName, visitorTeamName: visitorTeamName };
		socket.emit('boardUpdate', update);
	}
	

	// Used on page load. This listens for a message from the server to set all board settings. 
	socket.on('init', function (data) {
		var keys = Object.keys(data);
		for(var i = 0; i < keys.length; i++) {
			scoreBoard[keys[i]] = data[keys[i]];
		}
	});
	
  }]) // end of the controller class
	
	// Magic. Honestly I can't remember what this does.
  .factory('socket', function ($rootScope) {
  var socket = io.connect(); // connect to the server
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