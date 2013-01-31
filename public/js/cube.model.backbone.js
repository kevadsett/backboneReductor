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
	initialize: function(params){
		//console.log(params);
		if(params.colour){
			this.set({position: params.position, colour: params.colour});
		}
		this.bind('change', this.attributesChanged);
	},
	attributesChanged: function(){
		this.trigger("colourChanged", this.get('colour'));
	}/*,
	toJSON: function(){
		var returnObject = {};

		return returnObject;
	}*/
});

if(server) module.exports = CubeModel;