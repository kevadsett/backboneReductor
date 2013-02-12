var server = false;
if (typeof exports !== 'undefined') {
	server = true;
	Backbone = require('backbone');
	_ = require('underscore');
	Vectors = require('./Vectors');
	Vector3D = Vectors.Vector3D
}

var CubeModel = Backbone.Model.extend({
	defaults:{
		position: new Vector3D(0,0,0),
		positionSet: false,
		colour: '#000000'
	},
	urlRoot:'cube',
	socket:window.socket,
	noIoBind: false,
	initialize: function(){
		/*!
		 * if we are creating a new model to push to the server we don't want
		 * to iobind as we only bind new models from the server. This is because
		 * the server assigns the id.
		 */
		if (!this.noIoBind) {
		  this.ioBind('update', this.serverChange, this);
		  this.ioBind('delete', this.serverDelete, this);
		}
	},
	serverChange: function (data) {
		// Useful to prevent loops when dealing with client-side updates (ie: forms).
		data.fromServer = true;
		this.set(data);
	},
		serverDelete: function (data) {
		if (this.collection) {
			this.collection.remove(this);
		} else {
			this.trigger('remove', this);
		}
		this.modelCleanup();
	},
	modelCleanup: function () {
		this.ioUnbindAll();
		return this;
	}
});

if(server) module.exports = CubeModel;