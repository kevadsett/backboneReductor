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

var Cell = Backbone.Model.extend({
	defaults:{
		size:1,
		colour: '#000000',
	},
	initialize: function(features){
		this.bind('change', this.attributesChanged);
		this.set({position:features.position, colour:features.colour});
	}, 
	attributesChanged:function(){
		this.trigger("colourChanged", this.get('colour'));
	}
});

var Cells = Backbone.Collection.extend({
	model:Cell,
	defaults:{
		width:10,
		height:10,
		depth:10,
	},
	initialize:function(dimensions){
		_.bindAll(this, 'printCells', 'createCells', 'updateCell');
		if(dimensions)	{
			this.width = dimensions.width;
			this.height = dimensions.height;
		}
	},
	createCells:function(existingCells){
		console.log("debug:: creating new Cells collection size: [" + this.width + "][" + this.height + "][" + this.depth + "]");
		this.models = [];
		this.length = 0;
		if(server)
		{
			for (var i = 0; i< this.width; i++)
			{
				for(var j = 0; j<this.height; j++)
				{
					var position = new Vector2D({x:j, y:i});
					var value = 0.1;
					var cellModel = new Cell({position: position, size:this.cellSize, value:value});
					this.add(cellModel);
				}
			}
		}
		else
		{
			for(var i=0; i< existingCells.length; i++)
			{
				var cell = existingCells[i];
				var position = cell.position;
				var cellSize = cell.size;
				var value = cell.value;
				var cellModel = new Cell({position:position, size:cellSize, value: value});
				this.add(cellModel);
			}
		}
		console.log("this.length: " + this.length);
	},
	printCells:function(){
		_.each(this.models, this.printCell, this);
	},
	printCell:function(cell){
		console.log("cell.position.x: " + cell.get('position').x + ", cell.position.y: " + cell.get('position').y);
	},
	updateCell:function(index, value){
		this.models[index].set({value:value});
	}
});

if(server)
{
	exports.Vector2D = Vector2D;
	exports.Cell = Cell;
	exports.Cells = Cells;
}