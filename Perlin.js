var server = false;
if (typeof exports !== 'undefined') {
	server = true;
	Utils = require('./public/js/utils');
} 

var utils = new Utils();
function Perlin(){
}

Perlin.prototype.setupPerlin = function(pRows, pColumns)
{
	this.rows = pRows;
	this.columns = pColumns;
}

Perlin.prototype.generateNoise = function()
{
	var noise = new Array(this.rows)
	for(var i = 0; i < this.rows; i++)
	{
		noise[i] = new Array(this.columns)
		for(var j = 0; j < this.columns; j++)
		{
			noise[i][j] = Math.random();
		}
	}
	return noise;
}

Perlin.prototype.generateMountainNoise = function()
{
	var noise = new Array(this.rows)
	var midCol = this.columns / 2;
	var midRow = this.rows / 2;
	for(var i = 0; i < this.rows; i++)
	{
		noise[i] = new Array(this.columns)
		for(var j = 0; j < this.columns; j++)
		{
			var distanceValue = utils.map(utils.dist(i, j, midRow, midCol), 0, Math.min(midCol, midRow), 1, 0);
			distanceValue = Math.max(0, distanceValue);
			var lowerBound = Math.max(distanceValue - 0.4, 0);
			var range = distanceValue - lowerBound;
			noise[i][j] = Math.random() * range + lowerBound;
		}
	}
	return noise;
}

Perlin.prototype.generateRandomHeightMap = function(pMaxHeight)
{
	var heightmap = this.generateNoise();
	for(var i = 0; i < this.rows; i++)
	{
		for(var j = 0; j < this.columns; j++)
		{
			heightmap[i][j] *= pMaxHeight;
		}
	}
	return heightmap;
}

Perlin.prototype.generatePerlinHeightMap = function(pMaxHeight)
{
	maxHeight = pMaxHeight;
	var PerlinNoise = this.generatePerlinNoise(this.generateNoise(), 4);
	for(var i = 0; i < this.rows; i++)
	{
		for(var j = 0; j < this.columns; j++)
		{
			PerlinNoise[i][j] *= maxHeight;
		}
	}
	return PerlinNoise;
}

Perlin.prototype.generatePerlinMountainMap = function(pMaxHeight)
{
	var step = 1;
	var PerlinNoise = this.generatePerlinNoise(this.generateMountainNoise(), 4);
	for(var i = 0; i < this.rows; i++)
	{
		for(var j = 0; j < this.columns; j++)
		{
			PerlinNoise[i][j] *= pMaxHeight;
			PerlinNoise[i][j] = Math.round(PerlinNoise[i][j] / step);
		}
	}
	return PerlinNoise;
}

Perlin.prototype.lerp = function(a, b, f)
{
	return a + f * (b - a);
}

Perlin.prototype.generateSmoothNoise = function(baseNoise, octave)
{
	var smoothNoise = new Array(this.rows);
	for(var i = 0; i < this.rows; i++)
	{
		smoothNoise[i] = new Array(this.columns);
	}
	
	var samplePeriod = 1 << octave;
	var sampleFrequency = 1.0 / samplePeriod;
	
	for(var i=0; i < this.rows; i++)
	{
		// calculate vertical sampling indices
		var sample_i0 = Math.floor(i / samplePeriod) * samplePeriod;
		var sample_i1 = (sample_i0 + samplePeriod) % this.rows;
		var verticalBlend = (i - sample_i0) * sampleFrequency;
		for(var j = 0; j < this.columns; j++)
		{
			// calculate horizontal sampling indices
			var sample_j0 = Math.floor(j / samplePeriod) * samplePeriod;
			var sample_j1 = (sample_j0 + samplePeriod) % this.columns;
			var horizontalBlend = (j - sample_j0) * sampleFrequency;
			
			//console.log("sample_0: " + sample_i0 + ", " + sample_j0 + ". sample_1: " + sample_i1 + ", " + sample_j1);	
			
			// blend the top two corners
			var top = this.lerp(baseNoise[sample_i0][sample_j0], baseNoise[sample_i0][sample_j1], horizontalBlend);
			var bottom = this.lerp(baseNoise[sample_i1][sample_j0], baseNoise[sample_i1][sample_j1], horizontalBlend);
			
			// blend the two together
			smoothNoise[i][j] = this.lerp(top, bottom, verticalBlend);
		}
	}
	return smoothNoise;
}

Perlin.prototype.generatePerlinNoise = function(baseNoise, octaveCount)
{
	var persistence = 0.5;
	var amplitude = 1.0;
	var totalAmplitude = 0.0;
	
	var smoothNoise = new Array(octaveCount);
	for (var k=0; k < octaveCount; k++)
	{
		smoothNoise[k] = this.generateSmoothNoise(baseNoise, k);
	}
	var PerlinNoise = new Array(this.rows);
	for (var i=0; i<this.rows; i++)
	{
		PerlinNoise[i] = new Array(this.columns);
		for (var j=0; j<this.columns; j++)
		{
			PerlinNoise[i][j] = 0.0;
		}
	}
	
	for (var k=0; k < octaveCount; k++)
	{
		amplitude *= persistence;
		totalAmplitude += amplitude;
				
		for (var i=0; i<this.rows; i++)
		{
			for (var j=0; j<this.columns; j++)
			{
				PerlinNoise[i][j] += smoothNoise[k][i][j] * amplitude;
			}
		}
	}
	
	// normalisation
	for (var i = 0; i < this.rows; i++)
	{
		for (var j = 0; j < this.columns; j++)
		{
			PerlinNoise[i][j] /= totalAmplitude;
		}
	}
	
	return PerlinNoise;
}

if(server) module.exports = Perlin;