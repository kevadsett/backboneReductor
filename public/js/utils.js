var Utils = exports;

Utils.normalise = function(value, low, high)
{		
	var range = high - low;
	return (value - low) / range;
}

Utils.map = function(value, lo1, hi1, lo2, hi2)
{
	var normal = Utils.normalise(value, lo1, hi1);
	return normal * (hi2 - lo2) + lo2;
}

Utils.dist = function(x1, y1, x2, y2) // Pythag! :D
{
	return Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
}

Utils.getRandomColor = function() {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++ ) {
        color += letters[Math.round(Math.random() * 15)];
    }
    return color;
}

Utils.stripHexHash = function(hex)
{
	if(hex.replace) return hex.replace(/^\s*#|\s*$/g, '');
}

Utils.increaseBrightness = function(hex, percent){
	// strip the leading # if it's there
	hex = Utils.stripHexHash(hex);

	// convert 3 char codes --> 6, e.g. `E0F` --> `EE00FF`
	if(hex.length == 3){
		hex = hex.replace(/(.)/g, '$1$1');
	}

	var r = parseInt(hex.substr(0, 2), 16),
		g = parseInt(hex.substr(2, 2), 16),
		b = parseInt(hex.substr(4, 2), 16);

	return '' +
		((0|(1<<8) + r + (256 - r) * percent / 100).toString(16)).substr(1) +
		((0|(1<<8) + g + (256 - g) * percent / 100).toString(16)).substr(1) +
		((0|(1<<8) + b + (256 - b) * percent / 100).toString(16)).substr(1);
}

Utils.degToRad = function(degrees)
{
	return degrees * Math.PI / 180;
}

Utils.print2DArray = function(array)
{
	result = "";
	for(var i=0; i<array.length; i++)
	{
		for(var j=0; j<array[0].length; j++)
		{
			if(j<array[0].length-1)
			{
				result += array[i][j] + ",\t"
			}
			else
			{
				result += array[i][j]
			}
		}
		result += "\n"
	}
	console.log(result);
}

Utils.HexStringToUint = function(hex)
{
	return parseInt(Utils.stripHexHash(hex), 16);
}

Utils.UintToHexString = function(uint)
{
	return "#" + uint.toString(16).toUpperCase();
}

Utils.UintToRGB = function(uint)
{		
	var rgb = [];
	
	var r = uint >> 16 & 0xFF;
	var g = uint >> 8 & 0xFF;
	var b = uint & 0xFF;
	
	rgb.push(r, g, b);
	return rgb;
}

Utils.DetermineBrightness = function(colour)
{
	console.log("DetermineBrightness::colour: " + colour);
	var rgb = Utils.UintToRGB(colour);
	var brightness = Math.sqrt((rgb[0] * rgb[0] * 0.241) + (rgb[1] * rgb[1] * 0.691) + (rgb[2] * rgb[2] * 0.068) ) / 255;
	console.log("brightness: " + brightness);
	return brightness;
}

Utils.getCubeIndexFromVector = function(x, y, z)
{
	for (i in cubes) 
	{
		if(cubePositions[i].x == x && cubePositions[i].y == y && cubePositions[i].z == z)
		{
			return i;
		}
	}
	return -1;
}

Utils.cubeExistsAbove = function(x, y, z)
{
	var cubeAboveIndex = Utils.getCubeIndexFromVector(x, y+1, z);
	return (cubeAboveIndex != -1);
}