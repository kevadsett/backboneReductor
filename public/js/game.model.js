var utils = require('./utils');
function GameModel() {
	this.height = 10;
	this.width = 10;
	this.depth = 10;
	
	this.cubePositions = [];
	this.cubeColours = [];
	this.totalCubes = 0;
	
	this.playerCubes = new Array(2);
		
	this.subLight;

	this.colours = [this.utils.getRandomColor(), this.utils.getRandomColor()];
	
	this.generateLevelData();

	this.setCubeColours();
	
	//this.textColours = [this.utils.DetermineBrightness(this.utils.HexStringToUint(this.colours[0])) < 0.5 ? "#FFFFFF" : "#000000", this.utils.DetermineBrightness(this.utils.HexStringToUint(this.colours[1])) < 0.5 ? "#FFFFFF" : "#000000"];
}

GameModel.prototype.generateLevelData = function() {
	console.log("generatingLevelData");
	this.perlin.setupPerlin(this.width, this.depth);
	var heightMap = this.perlin.generatePerlinMountainMap(this.height);
	var colourChoice = 0;
	for(var i=0; i<this.width; i++) {
		for(var j = 0; j<this.depth; j++) {
			this.cubePositions.push(new Vector3D(i - (this.width/2), heightMap[i][j], j - (this.depth/2)));
			this.totalCubes ++;
			
			if(heightMap[i][j] != 0) {
				var currentHeight = heightMap[i][j];
				while (currentHeight != 0) {
					currentHeight--;
					this.cubePositions.push(new Vector3D(i - (this.width/2), currentHeight, j - (this.depth/2)));
					this.totalCubes ++;
				}
			}
		}
	}
}

GameModel.prototype.setCubeColours = function()
{
	this.cubeColours = new Array(this.totalCubes);
	var cubesLeftToPopulate = this.totalCubes;
	var colourChoice = 0;
	while (cubesLeftToPopulate > 0)
	{
		colourChoice = (colourChoice + 1) % 2;
		(colourChoice == 0) ? this.playerCubes[0] ++ : this.playerCubes[1] ++;
		
		var positionSelection = Math.floor(Math.random() * this.totalCubes);
		while(this.cubeColours[positionSelection] != null)
		{
			positionSelection = Math.floor(Math.random() * this.totalCubes);
		}
		this.cubeColours[positionSelection] = colourChoice;
		cubesLeftToPopulate--;
	}
	
	if(this.playerCubes[0] > this.playerCubes[1])
	{
		this.shaveTopCubeOff(this.colours[0]);
	}
	else if(this.playerCubes[0] < this.playerCubes[1])
	{
		this.shaveTopCubeOff(this.colours[1]);
	}
	console.log("playerCubes[0]: " + this.playerCubes[0] + ", playerCubes[1]: " + this.playerCubes[1]);
}

GameModel.prototype.shaveTopCubeOff = function(colourToRemove)
{
	var topPosition = new Vector3D(0, 0, 0);
	var topPositionIndex = 0;
	
	for(var i = 0; i < this.cubeColours.length; i++)
	{
		if(this.cubeColours[i] == colourToRemove)
		{	
			var currentPosition = this.cubePositions[i]
			, xIsBetter = Math.abs(currentPosition.x - this.width/2) < Math.abs(topPosition.x - this.width/2)
			, yIsBetter = currentPosition.y > topPosition.y
			, zIsBetter = Math.abs(currentPosition.z - this.depth/2) < Math.abs(topPosition.z - this.depth/2);

			if(xIsBetter && yIsBetter && zIsBetter)
			{
				topPosition = currentPosition;
				topPositionIndex = i;
			}
		}
	}
	this.cubePositions.splice(topPositionIndex, 1);
	this.cubeColours.splice(topPositionIndex, 1);
	
	var colourIndex = this.colours.indexOf(colourToRemove);
	if(colourIndex == 0)
	{
		this.playerCubes[0]--;
	}
	else if(colourIndex == 1)
	{
		playerCubes[1]--;
	}
}

GameModel.prototype.getCubeIndexFromVector = function(x, y, z)
{
	for (i in this.cubePositions) 
	{
		if(this.cubePositions[i].x == x && this.cubePositions[i].y == y && this.cubePositions[i].z == z)
		{
			return i;
		}
	}
	return -1;
}

GameModel.prototype.cubeExistsAbove = function(x, y, z)
{
	var cubeAboveIndex = this.getCubeIndexFromVector(x, y+1, z);
	return (cubeAboveIndex != -1);
}

module.exports = GameModel;