var Backbone = require('backbone'),
_ = require('underscore')._,
GameModel = require('./public/js/game.model.backbone');

var Lobby = Backbone.Collection.extend({
	//model:GameModel,
	initialize: function(params){
		//this.length = 0;
		console.log("initialising lobby");
		this.gameSize = 2;

		//console.log("this.models");
		//console.log(this.models.attributes);
		console.log("initialised lobby");
		//this.getGame();
		//_.bindAll(this, 'getGame');
	},
	getGame: function(){
		//console.log("getting game");
		//console.log("this.models:");
		//console.log(this.models.attributes);
		console.log("getting game");
		console.log("lobby.length: " + this.length);
		if(this.length == 0)
		{
			this.returnedGame = new GameModel({size: this.gameSize});
			this.add(this.returnedGame);
		}
		for(var i=0; i < this.length; i++){
			var game = this.at(i);
			switch(game.get('connectedPlayers')){
				case 0:
				case 1:
					this.returnedGame = game;
				break;
				case 2:
					this.returnedGame = new GameModel({size:this.gameSize});
					this.add(this.returnedGame);
				break;
			}
		}
		/*console.log("returnedGame attributes:");
		console.log(this.returnedGame.attributes);*/
	}
});

module.exports = Lobby;