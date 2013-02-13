var server = false;
if (typeof exports !== 'undefined') {
	server = true;
}
var Vector2D = function(x, y) {
	this.x = x;
	this.y = y;
};

var Vector3D = function(x, y, z) {
	this.x = x;
	this.y = y;
	this.z = z;
};

if(server)
{
	exports.Vector2D = Vector2D;
	exports.Vector3D = Vector3D;
}