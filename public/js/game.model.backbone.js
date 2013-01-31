var server = false;
if (typeof exports !== 'undefined') {
	server = true;
	Backbone = require('backbone');
	_ = require('underscore');
	Utils = require('./utils');
	Perlin = require('./perlin');
	Vectors = require('./Vectors');
	Cubes = require('./cube.collection.backbone');
	Cube = require('./cube.model.backbone');
	var Vector3D = Vectors.Vector3D;
}

var utils = new Utils();
var perlin = new Perlin();

var GameModel = Backbone.Model.extend({
	initialize: function(params){
		console.log("Initialising game model");
		this.set({cubes: new Cubes()});
		this.set({colours: utils.getTwoDifferentColours()});
		//console.log("this.get('cubes').length: " + this.get('cubes').length);
		_.bindAll(this, 'generateLevelData', 'setCubeColours', 'cloneModelFrom', 'shaveTopCubeOff', 'addPlayer', 'removePlayer', 'removeCube', 'toJSON');
		if(server){
			console.log("Creating model");
			this.set({height: params.size, width: params.size, depth: params.size});
			this.set({textColours: [utils.DetermineBrightness(utils.HexStringToUint(this.get('colours')[0])) < 0.5 ? "#FFFFFF" : "#000000", utils.DetermineBrightness(utils.HexStringToUint(this.get('colours')[1])) < 0.5 ? "#FFFFFF" : "#000000"]});
			this.generateLevelData();
			this.setCubeColours();
			
		} else {
			console.log("Cloning model from existing data");
			this.cloneModelFrom(params);			
		}
		//console.log(this.get('colours'));
	},
	generateLevelData: function(){
		var width = this.get('width')
		,	height = this.get('height')
		,	depth = this.get('depth')
		,	halfWidth = Math.floor(width/2)
		,	halfDepth = Math.floor(depth/2);
		//console.log("halfWidth: " + halfWidth);
		//console.log("halfDepth: " + halfDepth);
		console.log("Generating level data.");
		perlin.setupPerlin(width, depth);
		var heightMap = perlin.generatePerlinMountainMap(height);
		var colourChoice = 0;
		for(var i=0; i<width; i++) {
			for(var j = 0; j<depth; j++) {
				//var newPosition = new Vector3D({x: i - (width/2), y:heightMap[i][j], z:j - (depth/2)});
				var newPosition = new Vector3D({x: i - halfWidth , y:heightMap[i][j], z:j - halfDepth});
				this.get('cubes').addCube({position: newPosition});
				if(heightMap[i][j] != 0) {
					var currentHeight = heightMap[i][j];
					while (currentHeight != 0) {
						currentHeight--;
						//var newSubPosition = new Vector3D({x:i - (width/2), y:currentHeight, z:j - (depth/2)})
						var newSubPosition = new Vector3D({x:i - halfWidth, y:currentHeight, z:j - halfDepth})
						this.get('cubes').addCube({position: newSubPosition});
					}
				}
			}
		}
	},
	setCubeColours: function(){
		var playerCubes = new Array(2)
		,	colours = this.get('colours');
		console.log("Setting cube colours.");
		//console.log(this.get('cubes').length);
		playerCubes[0] = new Cubes();
		playerCubes[1] = new Cubes();
		var leftToPopulate = this.get('cubes').length;
		var positionChoices = [this.get('cubes').length];
		var colourChoice = 0;
		for(var i = 0; i < this.get('cubes').length; i++)
		{
			positionChoices[i] = this.get('cubes').at(i);
		}

		while (leftToPopulate > 0)
		{
			//console.log("leftToPopulate: " + leftToPopulate);
			var positionSelection = Math.floor(Math.random() * positionChoices.length);
			var cube = positionChoices[positionSelection];
			positionChoices.splice(positionSelection, 1);
			var cubeColour = this.get('colours')[colourChoice];
			cube.set({colour:cubeColour});
			playerCubes[colourChoice].add(cube);
			leftToPopulate--;
			colourChoice = (colourChoice + 1) % 2;
		}
		this.set({playerCubes: playerCubes});

		if(playerCubes[0].length > playerCubes[1].length)
		{
			console.log("Whoops, too many player 1 cubes");
			this.shaveTopCubeOff(0);
		}
		else if(playerCubes[0].length < playerCubes[1].length)
		{
			console.log("Whoops, too many player 2 cubes");
			this.shaveTopCubeOff(1);
		}
	},
	shaveTopCubeOff: function(playerToRemove){
		console.log("Shaving top cube off to even out the numbers.");
		var width = this.get('width')
		,	depth = this.get('depth')
		,	colours = this.get('colours');
		var topPosition = new Vector3D({x:width/2, y:0, z:depth/2});
		var topScore = 0;
		var topCube;

		for(var i = 0; i < this.get('playerCubes')[playerToRemove].length; i++)
		{

			var currentPosition = this.get('playerCubes')[playerToRemove].at(i).get('position');
			//console.log(currentPosition.attributes);
			var xIsBetter = Math.abs(currentPosition.get('x')) < Math.abs(topPosition.get('x'));
			//console.log("xIsBetter: " + xIsBetter);
			var yIsBetter = currentPosition.get('y') > topPosition.get('y');
			//console.log("yIsBetter: " + yIsBetter);
			var zIsBetter = Math.abs(currentPosition.get('z')) < Math.abs(topPosition.get('z'));
			//console.log("zIsBetter: " + zIsBetter);
			var cubeExistsAbove = utils.cubeExistsAbove(currentPosition.get('x'), currentPosition.get('y'), currentPosition.get('z'), this.get('cubes'));
			//console.log("cubeExistsAbove: " + cubeExistsAbove);
			var cubeScore = 0;
			if(xIsBetter) cubeScore++;
			if(yIsBetter) cubeScore+=2;
			if(zIsBetter) cubeScore++;
			if(cubeExistsAbove) cubeScore -= 10;
			//console.log("cubeScore: " + cubeScore);
			//console.log("topScore: " + topScore);
			if(cubeScore >= topScore)
			{
				topScore = cubeScore;
				topPosition = currentPosition;
				topCube = this.get('playerCubes')[playerToRemove].at(i);
			}
		}
		console.log("Removing cube at position [" + topPosition.get('x') + ", " + topPosition.get('y') + ", " + topPosition.get('z') + "]");
		this.get('playerCubes')[playerToRemove].remove(topCube);
		this.get('cubes').remove(topCube);
	},
	cloneModelFrom: function(model)
	{
		this.set({
			height: model.height,
			width: model.width,
			depth: model.depth,
			cubes:model.cubes,
			playerCubes: model.playerCubes,
			colours: model.colours,
			textColours: model.textColours
		});
	},
	addPlayer: function()
	{
		var noPlayers = this.get('connectedPlayers') || 0;
		this.set({connectedPlayers: noPlayers + 1});
	},
	removePlayer: function()
	{
		this.set({connectedPlayers: this.get('connectedPlayers') - 1});
	},
	removeCube: function(cubeModel)
	{
		var cubes = this.get('cubes');
		if(server){
			cubes.remove(cubeModel);
		}else{
			cubes.models.splice(cubes.models.indexOf(cubeModel), 1);
		}
		console.log(cubeModel);
		this.trigger('cubeRemoved', cubeModel);
	},
	toJSON: function()
	{
		var returnObject = {
			cid: this.cid,
			attributes: this.attributes,
			_changing: this._changing,
			_previousAttributes: this._previousAttributes,
			changed: this.changed,
			_pending: this._pending,
			generateLevelData: this.generateLevelData,
			setCubeColours: this.setCubeColours,
			cloneModelFrom: this.cloneModelFrom,
			shaveTopCubeOff: this.shaveTopCubeOff,
			addPlayer: this.addPlayer,
			removePlayer: this.removePlayer,
			removeCube: this.removeCube,
			toJSON: this.toJSON//,
			//collection: this.collection,
		};
		return returnObject;
	}
});

if(server) module.exports = GameModel;