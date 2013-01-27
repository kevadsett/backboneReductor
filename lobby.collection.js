var Backbone = require('backbone'),
_ = require('underscore')._,
GameModel = require('./public/js/game.model.backbone');

var Lobby = Backbone.Collection.extend({
	initialize: function(params){
		_.bindAll(this, 'getGame');
		//this.length = 0;
		console.log("initialising lobby");
		this.gameSize = params.gameSize;
		var game1 = new GameModel({size:this.gameSize});
		var game2 = new GameModel({size:this.gameSize});
		var game3 = new GameModel({size:this.gameSize});
		this.add([game1, game2, game3]);
		console.log("this.models:");
		console.log(this.models);
		console.log("initialised lobby");
	},
	getGame: function(){
		console.log("getting game");
		console.log(this.models);
		/*console.log("getting game");
		console.log("lobby.length: " + this.length);
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
		}*/
		/*console.log("returnedGame attributes:");
		console.log(this.returnedGame.attributes);*/
	}
});

module.exports = Lobby;