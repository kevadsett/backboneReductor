var Perlin = exports;
var Utils = require("./utils");
Perlin.setupPerlin = function(pRows, pColumns)
{
	Perlin.rows = pRows;
	Perlin.columns = pColumns;
}

Perlin.generateNoise = function()
{
	var noise = new Array(Perlin.rows)
	for(var i = 0; i < Perlin.rows; i++)
	{
		noise[i] = new Array(Perlin.columns)
		for(var j = 0; j < Perlin.columns; j++)
		{
			noise[i][j] = Math.random();
		}
	}
	return noise;
}

Perlin.generateMountainNoise = function()
{
	var noise = new Array(Perlin.rows)
	var midCol = Perlin.columns / 2;
	var midRow = Perlin.rows / 2;
	for(var i = 0; i < Perlin.rows; i++)
	{
		noise[i] = new Array(Perlin.columns)
		for(var j = 0; j < Perlin.columns; j++)
		{
			var distanceValue = Utils.map(Utils.dist(i, j, midRow, midCol), 0, Math.min(midCol, midRow), 1, 0);
			distanceValue = Math.max(0, distanceValue);
			var lowerBound = Math.max(distanceValue - 0.4, 0);
			var range = distanceValue - lowerBound;
			noise[i][j] = Math.random() * range + lowerBound;
		}
	}
	return noise;
}

Perlin.generateRandomHeightMap = function(pMaxHeight)
{
	var heightmap = Perlin.generateNoise();
	for(var i = 0; i < Perlin.rows; i++)
	{
		for(var j = 0; j < Perlin.columns; j++)
		{
			heightmap[i][j] *= pMaxHeight;
		}
	}
	return heightmap;
}

Perlin.generatePerlinHeightMap = function(pMaxHeight)
{
	maxHeight = pMaxHeight;
	var perlinNoise = Perlin.generatePerlinNoise(Perlin.generateNoise(), 4);
	for(var i = 0; i < Perlin.rows; i++)
	{
		for(var j = 0; j < Perlin.columns; j++)
		{
			perlinNoise[i][j] *= maxHeight;
		}
	}
	return perlinNoise;
}

Perlin.generatePerlinMountainMap = function(pMaxHeight)
{
	var step = 1;
	var perlinNoise = Perlin.generatePerlinNoise(Perlin.generateMountainNoise(), 4);
	for(var i = 0; i < Perlin.rows; i++)
	{
		for(var j = 0; j < Perlin.columns; j++)
		{
			perlinNoise[i][j] *= pMaxHeight;
			perlinNoise[i][j] = Math.round(perlinNoise[i][j] / step);
		}
	}
	return perlinNoise;
}

Perlin.lerp = function(a, b, f)
{
	return a + f * (b - a);
}

Perlin.generateSmoothNoise = function(baseNoise, octave)
{
	var smoothNoise = new Array(Perlin.rows);
	for(var i = 0; i < Perlin.rows; i++)
	{
		smoothNoise[i] = new Array(Perlin.columns);
	}
	
	var samplePeriod = 1 << octave;
	var sampleFrequency = 1.0 / samplePeriod;
	
	for(var i=0; i < Perlin.rows; i++)
	{
		// calculate vertical sampling indices
		var sample_i0 = Math.floor(i / samplePeriod) * samplePeriod;
		var sample_i1 = (sample_i0 + samplePeriod) % Perlin.rows;
		var verticalBlend = (i - sample_i0) * sampleFrequency;
		for(var j = 0; j < Perlin.columns; j++)
		{
			// calculate horizontal sampling indices
			var sample_j0 = Math.floor(j / samplePeriod) * samplePeriod;
			var sample_j1 = (sample_j0 + samplePeriod) % Perlin.columns;
			var horizontalBlend = (j - sample_j0) * sampleFrequency;
			
			//console.log("sample_0: " + sample_i0 + ", " + sample_j0 + ". sample_1: " + sample_i1 + ", " + sample_j1);	
			
			// blend the top two corners
			var top = Perlin.lerp(baseNoise[sample_i0][sample_j0], baseNoise[sample_i0][sample_j1], horizontalBlend);
			var bottom = Perlin.lerp(baseNoise[sample_i1][sample_j0], baseNoise[sample_i1][sample_j1], horizontalBlend);
			
			// blend the two together
			smoothNoise[i][j] = Perlin.lerp(top, bottom, verticalBlend);
		}
	}
	return smoothNoise;
}

Perlin.generatePerlinNoise = function(baseNoise, octaveCount)
{
	var persistence = 0.5;
	var amplitude = 1.0;
	var totalAmplitude = 0.0;
	
	var smoothNoise = new Array(octaveCount);
	for (var k=0; k < octaveCount; k++)
	{
		smoothNoise[k] = Perlin.generateSmoothNoise(baseNoise, k);
	}
	var perlinNoise = new Array(Perlin.rows);
	for (var i=0; i<Perlin.rows; i++)
	{
		perlinNoise[i] = new Array(Perlin.columns);
		for (var j=0; j<Perlin.columns; j++)
		{
			perlinNoise[i][j] = 0.0;
		}
	}
	
	for (var k=0; k < octaveCount; k++)
	{
		amplitude *= persistence;
		totalAmplitude += amplitude;
				
		for (var i=0; i<Perlin.rows; i++)
		{
			for (var j=0; j<Perlin.columns; j++)
			{
				perlinNoise[i][j] += smoothNoise[k][i][j] * amplitude;
			}
		}
	}
	
	// normalisation
	for (var i = 0; i < Perlin.rows; i++)
	{
		for (var j = 0; j < Perlin.columns; j++)
		{
			perlinNoise[i][j] /= totalAmplitude;
		}
	}
	
	return perlinNoise;
}