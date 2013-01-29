var server = false;
if (typeof exports !== 'undefined') {
	server = true;
}

function Utils(){
}

Utils.prototype.normalise = function(value, low, high)
{
	var range = high - low;
	return (value - low) / range;
}

Utils.prototype.map = function(value, lo1, hi1, lo2, hi2)
{
	var normal = this.normalise(value, lo1, hi1);
	return normal * (hi2 - lo2) + lo2;
}

Utils.prototype.dist = function(x1, y1, x2, y2) // Pythag! :D
{
	return Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
}

Utils.prototype.getTwoDifferentColours = function(){
	console.log("Utils::getTwoDifferentColours");
	var colour1 = this.getRandomColor();
	colour1 = this.getRGBArray(colour1);
	console.log(colour1);
	var colour2 = [(colour1[0] + 128)%256, (colour1[1] + 128)%256, (colour1[2] + 128)%256];
	console.log(colour2);
	colour1 = this.RGBToHexString(colour1);
	colour2 = this.RGBToHexString(colour2);
	return [colour1, colour2];
}

Utils.prototype.getRandomColor = function() {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++ ) {
        color += letters[Math.round(Math.random() * 15)];
    }
    return color;
}

Utils.prototype.getRGBArray = function(hex)
{
	// strip the leading # if it's there
	hex = this.stripHexHash(hex);

	// convert 3 char codes --> 6, e.g. `E0F` --> `EE00FF`
	if(hex.length == 3){
		hex = hex.replace(/(.)/g, '$1$1');
	}

	var r = parseInt(hex.substr(0, 2), 16),
		g = parseInt(hex.substr(2, 2), 16),
		b = parseInt(hex.substr(4, 2), 16);
	return [r,g,b];
}

Utils.prototype.stripHexHash = function(hex)
{
	if(hex.replace) return hex.replace(/^\s*#|\s*$/g, '');
}

Utils.prototype.increaseBrightness = function(hex, percent){
	// strip the leading # if it's there
	hex = this.stripHexHash(hex);

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

Utils.prototype.degToRad = function(degrees)
{
	return degrees * Math.PI / 180;
}

Utils.prototype.print2DArray = function(array)
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

Utils.prototype.HexStringToUint = function(hex)
{
	return parseInt(this.stripHexHash(hex), 16);
}

Utils.prototype.UintToHexString = function(uint)
{
	return "#" + uint.toString(16).toUpperCase();
}

Utils.prototype.UintToRGB = function(uint)
{
	var rgb = [];

	var r = uint >> 16 & 0xFF;
	var g = uint >> 8 & 0xFF;
	var b = uint & 0xFF;

	rgb.push(r, g, b);
	return rgb;
}

Utils.prototype.RGBToHexString = function(rgb){
	var r = rgb[0],
		g = rgb[1],
		b = rgb[2];
	var returnString = '#';
	for(var i=0; i<rgb.length; i++)
	{
		var string = rgb[i].toString(16);
		if(string.length == 1){
			string = string.replace(/(.)/g, '$1$1');
		}
		returnString += string;
	}
	return returnString.toUpperCase();
}

Utils.prototype.DetermineBrightness = function(colour)
{
	//console.log("DetermineBrightness::colour: " + colour);
	var rgb = this.UintToRGB(colour);
	var brightness = Math.sqrt((rgb[0] * rgb[0] * 0.241) + (rgb[1] * rgb[1] * 0.691) + (rgb[2] * rgb[2] * 0.068) ) / 255;
	//console.log("brightness: " + brightness);
	return brightness;
}

Utils.prototype.cubeExistsAbove = function(x, y, z, cubes)
{
	for(var i in cubes.models){
		var cube = cubes.models[i];
		if(cube.attributes)
		{
			cubePosition = cube.attributes.position.attributes;
		}
		else
		{
			cubePosition = cube.position;
		}
		var _x = cubePosition.x;
		var _y = cubePosition.y;
		var _z = cubePosition.z;
		if(_x == x && _y == y+1 && _z == z)
		{
			return true;
		}
	}
	return false;
}

if(server) module.exports = Utils;