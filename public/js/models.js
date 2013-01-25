var server = false;
if (typeof exports !== 'undefined') {
	server = true;
	Backbone = require('Backbone');
	_ = require('underscore');
} 
var Vector2D = Backbone.Model.extend({
	defaults:{
		x:0,
		y:0
	},
	initialize:function(position){
		if(position) this.set({x: position.x, y: position.y});
	}
});

var Vector3D = Backbone.Model.extend({
	defaults:{
		x:0,
		y:0,
		z:0
	},
	initialize:function(position){
		if(position) this.set({x: position.x, y: position.y, z:position.z});
	}
});

if(server)
{
	exports.Vector2D = Vector2D;
	exports.Vector3D = Vector3D;
}