var socket = io.connect(window.location.hostname);

var CellView = Backbone.View.extend({
	initialize:function() {
		_.bindAll(this, 'render', 'setRenderColour');
		this.setRenderColour();
		this.model.bind("valueChanged", this.setRenderColour);
	},
	render: function(){
		var canvas = document.getElementById('myCanvas');
		var context = canvas.getContext('2d');
		var size = this.model.get('size');
		var position = this.model.get('position');
		var x = position['x'];
		var y = position['y'];
		context.fillStyle = this.colour;
		context.fillRect(x * size, y * size, size, size); 
	},
	setRenderColour:function(){
		console.log("Cell model changed");
		var value = this.model.get('value');
		var hex = Math.floor(value * 255).toString(16);
		this.colour = '#' + hex + hex + hex;
		this.render();
	}
});

var GameView = Backbone.View.extend({
	el: $('body'), 
	initialize: function(initObj){
		$(this.el).append("<canvas id='myCanvas'></canvas>");
		this.el = document.getElementById('myCanvas');
		var size = initObj.size;
		this.cellViews = [];
		this.collection = new Cells({width: initObj.width, height: initObj.height, size: initObj.size});
		this.collection.createCells(initObj.model);
		var index = 0;
		for (var i = 0; i< this.collection.length; i++)
		{
			var cellModel = this.collection.at(i);
			this.cellViews.push(new CellView({model:cellModel}));
		}
		_.bindAll(this, 'render', 'resizeCanvas','onCanvasClicked', 'checkCellsClicked');
		
		this.resizeCanvas();
	},
	
	render: function(){
		var cells = this.cellViews;
		var canvas = this.el;
		var context = canvas.getContext('2d');
		context.clearRect(0, 0, canvas.width, canvas.height);
		for (var i = 0; i < cells.length; i ++)
		{
			var cellView = cells[i];
			cellView.render();
		}
		
	},

	resizeCanvas: function(){
		var canvas = this.el;
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
		this.render();
	},
	
	events:{
		"click canvas": "onCanvasClicked"
	},
	
	onCanvasClicked: function(e){
		var mouseX = e.pageX - $('#myCanvas').offset().left;
		var mouseY = e.pageY - $('#myCanvas').offset().top;
		console.log("mouse: " + mouseX + ", " + mouseY);
		this.checkCellsClicked(mouseX, mouseY);
	},
	
	checkCellsClicked:function(xPos, yPos) {
		var clickedIndex = -1;
		_.each(this.collection, function(element, index, list){
			var cell = list.at(index);
			var size = cell.get('size');
			var currentX = cell.get('position')['x'] * size;
			var currentY = cell.get('position')['y'] * size;
			if(xPos >= currentX && xPos < currentX + size && yPos >= currentY && yPos < currentY + size)
			{
				clickedIndex = index;
			}
		});
		if (clickedIndex >-1) {
			var cell = this.collection.at(clickedIndex);
			console.log("You clicked cell at " + cell.get('position')['x'] + ", " + cell.get('position')['y']);
			var newValue = Math.random(); 
			cell.set({value: newValue});
			socket.emit('cellClicked', {cellIndex: clickedIndex, cellValue: newValue});
		}
	}
});

socket.on('connected', function(data){
	console.log(data.model);
	gameView = new GameView({width: data.width, height: data.height, model: data.model, size: data.size});
	window.addEventListener('resize', gameView.resizeCanvas, false);
	gameView.render();
	socket.on('modelChanged', function(data){
		gameView.collection.updateCell(data.index, data.value);
	});
});