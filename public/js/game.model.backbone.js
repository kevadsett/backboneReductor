var server = false;
if (typeof exports !== 'undefined') {
	server = true;
	Backbone = require('Backbone');
	_ = require('underscore');
	Utils = require('./utils');
	Perlin = require('./perlin');
	models = require('./models');
	Cubes = require('./cube.collection.backbone');
	Cube = require('./cube.model.backbone');
	var Vector3D = models.Vector3D;
}

var utils = new Utils();
var perlin = new Perlin();

var GameModel = Backbone.Model.extend({
	defaults:{
		cubes: new Cubes(),
		colours: [utils.getRandomColor(), utils.getRandomColor()],
	},
	initialize: function(params){
		console.log(params);
		_.bindAll(this, 'generateLevelData', 'setCubeColours', 'cloneModelFrom', 'shaveTopCubeOff');
		if(params.colours){
			this.cloneModelFrom(params)
		} else if(params.height){
			this.set({height: params.height, width: params.width, depth: params.depth});
			this.set({textColours: [utils.DetermineBrightness(utils.HexStringToUint(this.get('colours')[0])) < 0.5 ? "#FFFFFF" : "#000000", utils.DetermineBrightness(utils.HexStringToUint(this.get('colours')[1])) < 0.5 ? "#FFFFFF" : "#000000"]});
			this.generateLevelData();
			this.setCubeColours();
		}
	},
	generateLevelData: function(){
		var width = this.get('width')
		,	height = this.get('height')
		,	depth = this.get('depth')
		,	cubes = this.get('cubes');
		console.log("Generating level data.");
		perlin.setupPerlin(width, depth);
		var heightMap = perlin.generatePerlinMountainMap(height);
		var colourChoice = 0;
		for(var i=0; i<width; i++) {
			for(var j = 0; j<depth; j++) {
				var newPosition = new Vector3D({x: i - (width/2), y:heightMap[i][j], z:j - (depth/2)});
				cubes.addCube({position: newPosition});
				if(heightMap[i][j] != 0) {
					var currentHeight = heightMap[i][j];
					while (currentHeight != 0) {
						currentHeight--;
						var newSubPosition = new Vector3D({x:i - (width/2), y:currentHeight, z:j - (depth/2)})
						cubes.addCube({position: newSubPosition});
					}
				}
			}
		}
		this.set({cubes: cubes});
	},
	setCubeColours: function(){
		var playerCubes = new Array(2)
		,	colours = this.get('colours');
		console.log("Setting cube colours.");
		playerCubes[0] = new Cubes();
		playerCubes[1] = new Cubes();
		var leftToPopulate = this.get('cubes').length;
		var colourChoice = 0;
		while (leftToPopulate > 0)
		{
			console.log("leftToPopulate: " + leftToPopulate);
			var positionSelection = Math.floor(Math.random() * this.get('cubes').length);
			while(this.get('cubes').at(positionSelection).get('positionSet') == true)
			{
				positionSelection = Math.floor(Math.random() * this.get('cubes').length);
			}
			this.get('cubes').at(positionSelection).set({positionSet:true});
			var cubePosition = this.get('cubes').at(positionSelection).get('position');
			var cubeColour = this.get('colours')[colourChoice];
			playerCubes[colourChoice].add(new Cube({position:cubePosition , colour:cubeColour}));
			leftToPopulate--;
			colourChoice = (colourChoice + 1) % 2;
		}
		this.set({playerCubes: playerCubes});

		if(playerCubes[0] > playerCubes[1])
		{
			this.shaveTopCubeOff(0);
		}
		else if(playerCubes[0] < playerCubes[1])
		{
			this.shaveTopCubeOff(1);
		}
	},
	shaveTopCubeOff: function(playerToRemove){
		console.log("Shaving top cube off to even out the numbers.");
		var width = this.get('width')
		,	depth = this.get('depth')
		,	colours = this.get('colours')
		var topPosition = new Vector3D(0, 0, 0);
		var topCube;

		for(var i = 0; i < this.get('playerCubes')[playerToRemove].length; i++)
		{
			var currentPosition = this.get('playerCubes')[playerToRemove].at(i).get('position')
			, xIsBetter = Math.abs(currentPosition.x - width/2) < Math.abs(topPosition.x - width/2)
			, yIsBetter = currentPosition.y > topPosition.y
			, zIsBetter = Math.abs(currentPosition.z - depth/2) < Math.abs(topPosition.z - depth/2);

			if(xIsBetter && yIsBetter && zIsBetter)
			{
				topPosition = currentPosition;
				topCube = this.get('playerCubes')[playerToRemove].at(i);
			}
		}
		this.get('playerCubes')[playerToRemove].remove(topCube);
	},
	cloneModelFrom: function(model)
	{
		this.set({
			height: model.h,
			width: model.w,
			depth: model.d,
			cubeColours: model.cubeColours,
			totalCubes: model.totalCubes,
			playerCubes: model.playerCubes,
			colours: model.colours,
			textColours: model.textColours
		});
	}
});

if(server) module.exports = GameModel;