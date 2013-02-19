var Perlin = require('./Perlin'),
	perlin = new Perlin(),
	Utils = require('./public/js/Utils'),
	utils = new Utils();
	Vectors = require('./public/js/Vectors');

function Lobby(){
	this.gamesInProgress = [];
}
Lobby.prototype.getGame = function(){
	console.log("Lobby:: getGame");
	console.log("this.gamesInProgress.length: " + this.gamesInProgress.length);
	if(this.gamesInProgress.length == 0)
	{
		console.log("No games in progress, returning new game");
		return this.addGame();
	}
	console.log("Games are in progess");
	var game = this.gamesInProgress[this.gamesInProgress.length - 1];
	console.log("game.id: " + game.id);
	console.log("game.connectedPlayers: " + game.connectedPlayers);
	switch(game.connectedPlayers){
		case 0:
		case 1:
			console.log("Game has 0 or 1 players, returning game");
			return game;
		break;
		case 2:

			console.log("Game has 2 players already, returning new game.")
			return this.addGame();
		break;
	}
};

Lobby.prototype.addGame = function(){
	this.gamesInProgress.push(new Game(this.gamesInProgress.length, true));
	return(this.gamesInProgress[this.gamesInProgress.length-1]);
};

Lobby.prototype.removeGame = function(gameToRemove){
	var gameIndex = this.gamesInProgress.indexOf(gameToRemove);
	if(gameIndex != -1) this.gamesInProgress.splice(gameIndex, 1);
}

function Game(id, realtime){
	console.log("New game. ID: " + id);
	this.id = id;
	this.realtime = realtime
	this.connectedPlayers = 0;
	this.size = 13;
	this.cubes = [];
	this.players = [];
	this.colours = utils.getTwoDifferentColours();
	this.generateLevel();
	if(this.realtime == false) this.turn = Math.round(Math.random());
	if(this.realtime == false) console.log("New game created, first turn: " + this.turn);
};

Game.prototype.addPlayer = function(player){
	this.players[this.connectedPlayers] = {id: player.id, name:player.name};
	this.connectedPlayers++;
	console.log(this.players);
};

Game.prototype.removePlayer = function(){
	this.connectedPlayers--;
};

Game.prototype.getOtherPlayerID = function(playerID){
	for(var i = 0; i < this.players.length; i++)
	{
		if(this.players[i].id != playerID){
			return this.players[i].id;
		}
	}
};

Game.prototype.getOtherPlayerName = function(playerID){
	for(var i = 0; i < this.players.length; i++)
	{
		if(this.players[i].id != playerID){
			return this.players[i].name;
		}
	}
};


Game.prototype.generateLevel = function(){
	perlin.setupPerlin(this.size, this.size);
	var heightMap = perlin.generatePerlinMountainMap(this.size);
	var index = 0;
	for(var i=0; i<this.size; i++) {
		for(var j = 0; j<this.size; j++) {
			var newPosition = new Vectors.Vector3D(Math.ceil(i - this.size/2), heightMap[i][j], Math.ceil(j -  this.size/2));
			this.cubes.push({id: index, position: newPosition});
			if(heightMap[i][j] != 0) {
				var currentHeight = heightMap[i][j];
				while (currentHeight != 0) {
					index++;
					currentHeight--;
					var newSubPosition = new Vectors.Vector3D(Math.ceil(i - this.size/2), currentHeight, Math.ceil(j - this.size/2));
					this.cubes.push({id: index, position: newSubPosition});

				}
			}
			index++;
		}
	}
	this.setCubeColours();
}

Game.prototype.setCubeColours = function(){
	console.log("Setting cube colours.");

	this.playerCubes = new Array(2)
	,	positionChoices = this.cubes.slice(0)
	,	leftToPopulate = positionChoices.length
	,	colourChoice = 0;
	this.playerCubes[0] = [];
	this.playerCubes[1] = [];
	while (leftToPopulate > 0)
	{
		//console.log("leftToPopulate: " + leftToPopulate);
		var positionSelection = Math.floor(Math.random() * positionChoices.length);
		var cube = positionChoices[positionSelection];
		positionChoices.splice(positionSelection, 1);
		var cubeColour = this.colours[colourChoice];
		cube.colour = cubeColour;
		this.playerCubes[colourChoice].push(cube);
		leftToPopulate--;
		colourChoice = (colourChoice + 1) % 2;
	}

	if(this.playerCubes[0].length > this.playerCubes[1].length)
	{
		console.log("Whoops, too many player 1 cubes");
		this.shaveTopCubeOff(0);
	}
	else if(this.playerCubes[0].length < this.playerCubes[1].length)
	{
		console.log("Whoops, too many player 2 cubes");
		this.shaveTopCubeOff(1);
	}
};

Game.prototype.shaveTopCubeOff = function(playerToRemove){
	console.log("Shaving top cube off to even out the numbers.");
	var width = this.size
	,	depth = this.size
	,	colours = this.colours;
	var topPosition = new Vectors.Vector3D({x:width/2, y:0, z:depth/2});
	var topScore = 0;
	var topCube;

	for(var i = 0; i < this.playerCubes[playerToRemove].length; i++)
	{

		var currentPosition = this.playerCubes[playerToRemove][i].position;
		//console.log(currentPosition.attributes);
		var xIsBetter = Math.abs(currentPosition.x) < Math.abs(topPosition.x);
		//console.log("xIsBetter: " + xIsBetter);
		var yIsBetter = currentPosition.y > topPosition.y;
		//console.log("yIsBetter: " + yIsBetter);
		var zIsBetter = Math.abs(currentPosition.z) < Math.abs(topPosition.z);
		//console.log("zIsBetter: " + zIsBetter);
		var cubeExistsAbove = utils.cubeExistsAbove(currentPosition.x, currentPosition.y, currentPosition.z, this.cubes);
		//console.log("cubeExistsAbove: " + cubeExistsAbove);
		var cubeScore = 0;
		if(xIsBetter) cubeScore++;
		if(yIsBetter) cubeScore+=2;
		if(zIsBetter) cubeScore++;
		if(cubeExistsAbove) cubeScore -= 1000;
		console.log("i: " + i + " | cubeScore: " + cubeScore);
		console.log("topScore: " + topScore);
		if(cubeScore >= topScore)
		{
			topScore = cubeScore;
			topPosition = currentPosition;
			topCube = this.playerCubes[playerToRemove][i];
		}
	}
	console.log("Removing cube at position [" + topPosition.x + ", " + topPosition.y + ", " + topPosition.z + "]");
	this.playerCubes[playerToRemove].splice(topCube.id, 1);
	this.cubes.splice(topCube.id, 1);
	this.resetCubeIDs();
};

Game.prototype.resetCubeIDs = function()
{
	for (var i = 0; i < this.cubes.length; i++)
	{
		this.cubes[i].id = i;
	}
}

Game.prototype.deleteCube = function(cubeID){
	this.cubes.splice(cubeID, 1);
	if(this.realtime == false) this.turn = (this.turn + 1) % 2;
	if(this.realtime == false) console.log("new turn: " + this.turn);
};

module.exports = Lobby;