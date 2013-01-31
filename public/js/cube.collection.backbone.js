var server = false;
if (typeof exports !== 'undefined') {
	server = true;
	Backbone = require('backbone');
	_ = require('underscore');
	Utils = require('./utils');
	Perlin = require('./perlin');
	Vectors = require('./Vectors');
	CubeModel = require('./cube.model.backbone');
	var Vector3D = Vectors.Vector3D;
}

var utils = new Utils();
var perlin = new Perlin();

var Cubes = Backbone.Collection.extend({
	model:CubeModel,
	initialize: function(){
		_.bindAll(this, 'addCube');
		this.models = [];
	},
	addCube: function(params){
		var position = params.position;
		this.add(new CubeModel({position: position}));
	},
	toJSON: function(){
		return this;
	}
});

if(server) module.exports = Cubes;