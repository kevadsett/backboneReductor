var CubeModel = Backbone.Model.extend({
	defaults:{
		position: new Vector3D(0,0,0),
		colour: '#000000'
	},
	initialize: function(){
		this.bind('change', this.attributesChanged);
	},
	attributesChanged: function(){
		this.trigger("colourChanged", this.get('colour'));
	}
});

var CubeCollection = Backbone.Collection.extend({
	model:CubeModel,

});