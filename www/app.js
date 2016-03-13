angular.module('scoreBoardApp', [])
  .controller('ScoreBoardController', function() {
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
	
	function snapshotState() {
		// generally history is always saved. This flag is used primarily when starting a new game.
		if(scoreBoard.historyOn) {
			// create a new state object containing all of the current values, and store it in the history
			var state = {};
			state.homeTeamName = scoreBoard.homeTeamName;
			state.homeScore = scoreBoard.homeScore;
			state.visitorTeamName = scoreBoard.visitorTeamName;
			state.visitorScore = scoreBoard.visitorScore;
			state.inning = scoreBoard.inning;
			state.isTopOfInning = scoreBoard.isTopOfInning;
			state.outs = scoreBoard.outs;
			state.strikes = scoreBoard.strikes;
			state.balls = scoreBoard.balls;
			scoreBoard.history.push(state);
			// if there are more than 5 previous states in the history, remove the oldest one
			if(scoreBoard.history.length > 5)
				scoreBoard.history.shift();
		}
	}
	
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
		}
	}
 
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
			if(changeInning) // changing the inning will create a snapshot, so only create a snapshot here if not changing the inning
				scoreBoard.nextHalfInning();
			else
				snapshotState();
			scoreBoard.outs = outs;
			scoreBoard.strikes = strikes;
			scoreBoard.balls = balls;
		}
	}
    scoreBoard.addStrike = function() {
		setBSO(1+scoreBoard.strikes, scoreBoard.balls, scoreBoard.outs);
    };
    scoreBoard.removeStrike = function() {
		setBSO(scoreBoard.strikes-1, scoreBoard.balls, scoreBoard.outs);
    };
    scoreBoard.addBall = function() {
		setBSO(scoreBoard.strikes, 1+scoreBoard.balls, scoreBoard.outs);
    };
    scoreBoard.removeBall = function() {
		setBSO(scoreBoard.strikes, scoreBoard.balls-1, scoreBoard.outs);
    };
    scoreBoard.addOut = function() {
		setBSO(scoreBoard.strikes, scoreBoard.balls, 1+scoreBoard.outs);
    };
    scoreBoard.removeOut = function() {
		setBSO(scoreBoard.strikes, scoreBoard.balls, scoreBoard.outs-1);
    };
    scoreBoard.newBatter = function() {
		// a new batter clears the count, but does not effect the outs
		setBSO(0, 0, scoreBoard.outs);
    };
	function setHomeScore(score) {
		if(score >= 0) { // teams may not have a score below zero
			snapshotState();
			scoreBoard.homeScore = score;
		}
	}
	scoreBoard.addRunHome = function() {
		setHomeScore(1+scoreBoard.homeScore);
	};
	scoreBoard.removeRunHome = function() {
		setHomeScore(scoreBoard.homeScore-1);
	};
	function setVisitorScore(score) {
		if(score >= 0) { // teams may not have a score below zero
			snapshotState();
			scoreBoard.visitorScore = score;
		}
	}
	scoreBoard.addRunVisitor = function() {
		setVisitorScore(1+scoreBoard.visitorScore);
	};
	scoreBoard.removeRunVisitor = function() {
		setVisitorScore(scoreBoard.visitorScore-1);
	};
	function setInning(inning, isTop) {
		if(inning > 0) { // the inning must be at least the first (1)
			snapshotState();
			scoreBoard.inning = inning;
			scoreBoard.isTopOfInning = isTop;
		}
	}
	scoreBoard.nextHalfInning = function() {
		// if it is currently the top of the inning then it will become the bottom of the same inning
		if(scoreBoard.isTopOfInning) {
			setInning(scoreBoard.inning, false);
		} else { // if it is the bottom of the inning then is will become the top of the next inning
			setInning(1+scoreBoard.inning, true);
		}
	}
	scoreBoard.previousHalfInning = function() {
		//if it is currently the top of the inning then it will become the bottom of the previous inning
		if(scoreBoard.isTopOfInning) {
			setInning(scoreBoard.inning-1, false);
		} else { // if it is the bottom of the inning then is will become the top of the same inning
			setInning(scoreBoard.inning, true);
		}
	};
	function setCorrectionMode(correctionModeOn) {
		scoreBoard.correctionModeOn = correctionModeOn;
	}
	scoreBoard.toggleCorrectionMode = function() {
		setCorrectionMode(!scoreBoard.correctionModeOn);
	};
	scoreBoard.isCorrectionMode = function() {
		return scoreBoard.correctionModeOn;
	};
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
			
			// the game is reset, turn the history back on
			scoreBoard.historyOn = true;
		}
	};
	
	
  });