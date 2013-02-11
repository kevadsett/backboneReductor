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

var CubeCollection = Backbone.Collection.extend({
	model:CubeModel,
	url:'cubecollection',
	socket:window.socket,
	initialize: function(){
		_.bindAll(this, 'serverCreate', 'collectionCleanup');
		this.ioBind('create', this.serverCreate, this);
	},
	serverCreate: function (data) {
	// make sure no duplicates, just in case
		var exists = this.get(data.id);
		if (!exists) {
			this.add(data);
		} else {
			data.fromServer = true;
			exists.set(data);
		}
	},
	collectionCleanup: function (callback) {
		this.ioUnbindAll();
		this.each(function (model) {
			model.modelCleanup();
		});
		return this;
	}
});

if(server) module.exports = CubeCollection;