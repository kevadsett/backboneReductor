var server = false;
if (typeof exports !== 'undefined') {
	server = true;
	Backbone = require('Backbone');
	_ = require('underscore');
	Utils = require('./utils');
	Perlin = require('./perlin');
	models = require('./models');
	Cubes = require('.cube.collection.backbone');
	var Vector3D = models.Vector3D;
}

var utils = new Utils();
var perlin = new Perlin();

var GameModel = Backbone.Model.extend({
	defaults:{
		cubePositions: [],

		totalCubes: 0,
		playerCubes: new Array(2),
		colours: [utils.getRandomColor(), utils.getRandomColor()],
	},
	initialize: function(params){
		console.log(params);
		if(params.colours){
			this.cloneModelFrom(params)
		} else if(params.height){
			this.set({height: params.height, width: params.width, depth: params.depth});
			this.set({textColours: [utils.DetermineBrightness(utils.HexStringToUint(this.get('colours')[0])) < 0.5 ? "#FFFFFF" : "#000000", utils.DetermineBrightness(utils.HexStringToUint(this.get('colours')[1])) < 0.5 ? "#FFFFFF" : "#000000"]});
			_.bindAll(this, 'generateLevelData', 'setCubeColours', 'cloneModelFrom', 'shaveTopCubeOff');
			this.generateLevelData();
			this.setCubeColours();
		}
	},
	generateLevelData: function(){
		var width = this.get('width')
		,	height = this.get('height')
		,	depth = this.get('depth')
		,	cubePositions = this.get('cubePositions')
		,	totalCubes = this.get('totalCubes');
		console.log("Generating level data.");
		perlin.setupPerlin(width, depth);
		var heightMap = perlin.generatePerlinMountainMap(height);
		var colourChoice = 0;
		for(var i=0; i<width; i++) {
			for(var j = 0; j<depth; j++) {
				cubePositions.push(new Vector3D(i - (width/2), heightMap[i][j], j - (depth/2)));
				totalCubes ++;

				if(heightMap[i][j] != 0) {
					var currentHeight = heightMap[i][j];
					while (currentHeight != 0) {
						currentHeight--;
						cubePositions.push(new Vector3D(i - (width/2), currentHeight, j - (depth/2)));
						totalCubes ++;
					}
				}
			}
		}
		this.set({cubePositions: cubePositions, totalCubes: totalCubes});
	},
	setCubeColours: function(){
		var playerCubes = this.get('playerCubes')
		,	cubeColours = this.get('cubeColours')
		,	totalCubes = this.get('totalCubes')
		,	colours = this.get('colours');
		console.log("Setting cube colours.");
		playerCubes[0] = new Cubes();
		playerCubes[1] = new Cubes();
		cubeColours = new Array(totalCubes);
		var cubesLeftToPopulate = totalCubes;
		var colourChoice = 0;
		while (cubesLeftToPopulate > 0)
		{
			colourChoice = (colourChoice + 1) % 2;
			(colourChoice == 0) ? playerCubes[0] ++ : playerCubes[1] ++;
			var positionSelection = Math.floor(Math.random() * totalCubes);
			while(cubeColours[positionSelection] != null)
			{
				positionSelection = Math.floor(Math.random() * totalCubes);
			}
			cubeColours[positionSelection] = colourChoice;
			cubesLeftToPopulate--;
		}
		this.set({playerCubes: playerCubes, cubeColours: cubeColours});

		if(playerCubes[0] > playerCubes[1])
		{
			this.shaveTopCubeOff(colours[0]);
		}
		else if(playerCubes[0] < playerCubes[1])
		{
			this.shaveTopCubeOff(colours[1]);
		}
	},
	shaveTopCubeOff: function(colourToRemove){
		console.log("Shaving top cube off to even out the numbers.");
		var cubeColours = this.get('cubeColours')
		,	cubePositions = this.get('cubePositions')
		,	playerCubes = this.get('playerCubes')
		,	width = this.get('width')
		,	depth = this.get('depth')
		,	colours = this.get('colours')
		var topPosition = new Vector3D(0, 0, 0);
		var topPositionIndex = 0;

		for(var i = 0; i < cubeColours.length; i++)
		{
			if(cubeColours[i] == colourToRemove)
			{
				var currentPosition = cubePositions[i]
				, xIsBetter = Math.abs(currentPosition.x - width/2) < Math.abs(topPosition.x - width/2)
				, yIsBetter = currentPosition.y > topPosition.y
				, zIsBetter = Math.abs(currentPosition.z - depth/2) < Math.abs(topPosition.z - depth/2);

				if(xIsBetter && yIsBetter && zIsBetter)
				{
					topPosition = currentPosition;
					topPositionIndex = i;
				}
			}
		}
		cubePositions.splice(topPositionIndex, 1);
		cubeColours.splice(topPositionIndex, 1);

		var colourIndex = colours.indexOf(colourToRemove);
		if(colourIndex == 0)
		{
			playerCubes[0]--;
		}
		else if(colourIndex == 1)
		{
			playerCubes[1]--;
		}

		this.set({cubeColours: cubeColours, cubePositions: cubePositions, playerCubes: playerCubes});
	},
	cloneModelFrom: function(model)
	{
		this.set({
			height: model.height,
			width: model.depth,
			depth: model.depth,
			cubePositions: model.cubePositions,
			cubeColours: model.cubeColours,
			totalCubes: model.totalCubes,
			playerCubes: model.playerCubes,
			colours: model.colours,
			textColours: model.textColours
		});
	}
});

if(server) module.exports = GameModel;