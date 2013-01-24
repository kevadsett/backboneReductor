var server = false;
if (typeof exports !== 'undefined') {
	server = true;
	Backbone = require('Backbone');
	_ = require('underscore');
	Utils = require('./utils');
	Perlin = require('./perlin');
	models = require('./models');
	CubeModel = require('./cube.collection.backbone');
	var Vector3D = models.Vector3D;
}

var utils = new Utils();
var perlin = new Perlin();

var Cubes = Backbone.Collection.extend({
	model:CubeModel,
	defaults:{
		cubePositions: [],
		cubeColours: []
	},
	initialize: function(){
		_.bindAll(this, 'addCube');
	},
	addCube: function(position, colour){
		this.add(new CubeModel({position: position, colour: colour});
	}
});

if(server) module.exports = Cubes;