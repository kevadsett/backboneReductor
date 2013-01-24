var server = false;
if (typeof exports !== 'undefined') {
	server = true;
	Backbone = require('Backbone');
	_ = require('underscore');
	models = require('./models');
	var Vector3D = models.Vector3D;
}

var CubeModel = Backbone.Model.extend({
	defaults:{
		position: new Vector3D(0,0,0),
		colour: '#000000'
	},
	initialize: function(params){
		console.log(params);
		if(params.colour){
			this.set({position: params.position, colour: params.colour});
		}
		this.bind('change', this.attributesChanged);
	},
	attributesChanged: function(){
		this.trigger("colourChanged", this.get('colour'));
	}
});

if(server) module.exports = CubeModel;