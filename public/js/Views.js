Reductor = {};
Reductor.scene = new THREE.Scene();
Reductor.utils = new Utils();
var CubeView = Backbone.View.extend({
	initialize: function(params){
		//console.log(params);
		this.material = new THREE.MeshLambertMaterial({color: this.model.get('colour')});
		this.geometry = new THREE.CubeGeometry(1, 1, 1);
		this.mesh = new THREE.Mesh(this.geometry, this.material);
		this.mesh.position.x = this.model.get('position').x;
		this.mesh.position.y = this.model.get('position').y;
		this.mesh.position.z = this.model.get('position').z;
		_.bindAll(this, 'attributesChanged', 'addToScene', 'removeFromScene');
		this.bind('change', this.attributesChanged);
		this.addToScene();
	},
	attributesChanged: function(){
		this.trigger("colourChanged", this.get('colour'));
	},
	addToScene: function()
	{
		Reductor.scene.add(this.mesh);
	},
	removeFromScene: function()
	{
		Reductor.scene.remove(this.mesh);
	}
});

var GameView = Backbone.View.extend({
	el: $('body'),
	initialize: function(params){
		this.gameStarted = false;
		this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
		this.projector = new THREE.Projector();
		this.targetX = 0;
		this.targetZ = 0;
		this.rotAmount = Math.PI/4;
		this.rotSpeed = Math.PI/12;
		this.animFrames = Math.round(this.rotAmount / this.rotSpeed);
		this.currentAnimFrame = 0;
		this.movementDirection = 0;
		this.LEFT = -1;
		this.RIGHT = 1;
		this.lastTime = 0;
		this.cubeViews = [];
		this.playerNumber = params.playerNumber;
		this.colours = params.colours;
		this.realtime = params.realtime;
		this.turn = params.turn;
		this.playerNames = [];
		for(var i=0; i<params.players.length; i++)
		{
			this.playerNames.push(params.players[i].name);
		}
		var cameraDistance = this.model.size + 5;
		this.camera.position.set(cameraDistance, cameraDistance, cameraDistance);
		this.camera.lookAt(Reductor.scene.position);
		_.bindAll(this, 'render', 'resizeCanvas','setupRenderer', 'initialiseCubeViews', 'createLights', 'onMouseMoved', 'onMouseDown', 'removeCube', 'getIntersects', 'onKeyDown', 'getCubeMeshIDByPosition', 'getCubeModelIDByPosition',  'getCubeViewByPosition', 'logCubeModels', 'resetCubeIDs', 'serverRemovedCube');

		this.setupRenderer();
		this.resizeCanvas();
		this.initialiseCubeViews();
		this.createLights()
		this.render();

		this.serverRemoved = false;

		this.model.bind('remove', this.cubeRemoved, this);

		var self = this;
		window.socket.on('playerJoined', function(data){
			console.log("New player joined! " + data.name)
			self.playerNames.push(data.name);
			self.render();
		});
		window.socket.on('modelCubeRemoved', function(data){
			console.log("Server cube removed. Model ID: " + data.cubeID);
			self.serverRemovedCube(data.cubeID);
		});
		window.socket.on('turnChanged', function(data){
			console.log("Turn has changed, new turn = " + data.turn);
			if(self.turn != data.turn) self.turn = data.turn;
			self.render();
		});
		window.socket.on('otherPlayerQuit'), function(data){
			console.log("Other player quit");
			alert("The other player has quit. Sorry");
		}
	},

	cubeRemoved: function(options){
		console.log("options.get('id'): " + options.get('id'));
		console.log("options.id: " +  options.id);
		console.log("Sending ID: " + options.get('id') + " to server");
		if(this.serverRemoved == false) window.socket.emit('cubeRemoved', {cubeID: options.get('id')});
	},

	initialiseCubeViews: function(){
		var self = this;
		_.each(self.model.models, function(model){
			var cubeView = new CubeView({model: model});
			self.cubeViews.push(cubeView.mesh);
		});

	},

	createLights: function() {
		var vec1 = new THREE.Vector3(this.model.size, this.model.size, this.model.size);
		var vec2 = new THREE.Vector3(-this.model.size, -this.model.size, -this.model.size);

		var mainLight = new THREE.PointLight(0xFFFFFF, 1);
		mainLight.position.set(vec1.x, vec1.y, vec1.z);
		Reductor.scene.add(mainLight);

		var subLight = new THREE.PointLight(0xFFFFFF, 1);
		subLight.position.set(vec2.x, vec2.y, vec2.z);
		Reductor.scene.add(subLight);
	},

	setupRenderer: function(){
		this.renderer = new THREE.WebGLRenderer({antialias: true});
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		this.renderer.setClearColorHex( 0xEEEEEE, 1 );
		this.renderer.domElement.addEventListener( 'mousemove', this.onMouseMoved, false );
		$(document).keydown(this.onKeyDown);
		this.renderer.domElement.addEventListener( 'mousedown', this.onMouseDown, false );
		window.addEventListener( 'resize', this.resizeCanvas, false );
		$('body').append(this.renderer.domElement);
	},

	render: function() {
		var timeNow = new Date().getTime();
		if (this.lastTime != 0) {
			var elapsed = timeNow - this.lastTime;

			if(this.moving)
			{
				this.camX = this.camera.position.x;
				this.camZ = this.camera.position.z;

				if(this.currentAnimFrame == this.animFrames)
				{
					this.moving = false;
					this.movementDirection = 0;
				}

				if(this.movementDirection == this.LEFT)
				{
					this.camera.position.x = this.camX * Math.cos(this.rotSpeed) - this.camZ * Math.sin(this.rotSpeed)/* * elapsed*/;
					this.camera.position.z = this.camZ * Math.cos(this.rotSpeed) + this.camX * Math.sin(this.rotSpeed)/* * elapsed*/;
				}
				else if (this.movementDirection == this.RIGHT)
				{
					this.camera.position.x = this.camX * Math.cos(this.rotSpeed) + this.camZ * Math.sin(this.rotSpeed)/* * elapsed*/;
					this.camera.position.z = this.camZ * Math.cos(this.rotSpeed) - this.camX * Math.sin(this.rotSpeed)/* * elapsed*/;
				}
				this.currentAnimFrame++;
				this.camera.lookAt(Reductor.scene.position);
			}

		}
		this.lastTime = timeNow;
		this.renderer.render(Reductor.scene, this.camera);
		var myKeyNumber = this.playerNumber;
		var otherKeyNumber = (this.playerNumber + 1) % 2;
		var textColours = [Reductor.utils.DetermineBrightness(Reductor.utils.HexStringToUint(this.colours[0])) < 0.5 ? "#FFFFFF" : "#000000", Reductor.utils.DetermineBrightness(Reductor.utils.HexStringToUint(this.colours[1])) < 0.5 ? "#FFFFFF" : "#000000"];
		if(this.realtime == false) 
		{
			if (this.turn == this.playerNumber) {
				$('#key1 .keyNumber').removeClass("otherTurn");
				$('#key1 .keyNumber').addClass("myTurn");
				$('#key2 .keyNumber').removeClass("myTurn");
				$('#key2 .keyNumber').addClass("otherTurn");
			}else{
				$('#key1 .keyNumber').addClass("otherTurn");
				$('#key1 .keyNumber').removeClass("myTurn");
				$('#key2 .keyNumber').addClass("myTurn");
				$('#key2 .keyNumber').removeClass("otherTurn");
			}
		}

		$('#key1 .keyNumber').css({
			'background-color': this.colours[myKeyNumber],
			'color': textColours[myKeyNumber]
		});
		$('#key1 .keyNumber').html(this.getPlayerCubes(myKeyNumber).length);
		$('#key1 .keyName').html(this.playerNames[myKeyNumber]);

		$('#key2 .keyNumber').css({
			'background-color': this.colours[otherKeyNumber],
			'color': textColours[otherKeyNumber]
		})
		$('#key2 .keyNumber').html(this.getPlayerCubes(otherKeyNumber).length);
		$('#key2 .keyName').html(this.playerNames[otherKeyNumber]);
		
		if(this.realtime == false) 
		{
			var turnText = this.playerNumber == this.turn ? "Your turn" : this.playerNames[this.turn] + "'s turn";
			$('#turnText').html(turnText);
		}
		if(this.moving) window.requestAnimationFrame(this.render);
	},
	getPlayerCubes:function(playerNumber){
		var list = [];
		var self = this;
		for(var i=0; i<self.model.length; i++){
			var cube = self.model.at(i);
			if (cube.get('colour') == self.colours[playerNumber])
			{
				list.push(cube);
			}
		}
		return list;
	},

	resizeCanvas: function(){
		var canvas = $('canvas');
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
		this.camera.aspect = window.innerWidth / window.innerHeight;
		this.camera.updateProjectionMatrix();

		this.renderer.setSize( window.innerWidth, window.innerHeight );
		this.render();

	},

	/*events:{
		"mouseover": "onMouseMoved",
	},*/

	onMouseMoved: function(event){
		event.preventDefault();
		var intersects = this.getIntersects(event);
		if ( intersects ) {
			if(intersects.length > 0)
			{
				if(this.INTERSECTED != intersects[ 0 ].object)
				{
					if(this.INTERSECTED)
					{
						this.INTERSECTED.material.color.setHex(Reductor.utils.HexStringToUint(this.INTERSECTED.currentHex));
						this.render();
					}
					this.INTERSECTED = intersects[0].object;
					//console.log(this.INTERSECTED.id + ": {" + this.INTERSECTED.position.x, this.INTERSECTED.position.y, this.INTERSECTED.position.z + "}");
					this.INTERSECTED.currentHex = Reductor.utils.UintToHexString(this.INTERSECTED.material.color.getHex());
					this.INTERSECTED.colourIndex = this.colours.indexOf(this.INTERSECTED.currentHex);
					if(this.cubeIsSelectable(this.INTERSECTED))
					{
						this.INTERSECTED.selectable = true;
						//var brighterColour = Reductor.utils.increaseBrightness(this.INTERSECTED.currentHex, 40);
						//this.INTERSECTED.material.color.setHex(Reductor.utils.HexStringToUint(brighterColour));
						this.INTERSECTED.material.color.setHex(0xFFFFFF);
						this.render();
					}
				}
			}
		else
			{
				if(this.INTERSECTED)
				{
					this.INTERSECTED.material.color.setHex(Reductor.utils.HexStringToUint(this.INTERSECTED.currentHex));
					this.render();
				}

				this.INTERSECTED = null;
			}
		}

	},
	onMouseDown: function(event)
	{
		var self = this;

		event.preventDefault();
		if((this.realtime == true && this.turn == this.playerNumber) || this.realtime == false)
		{
			if (self.INTERSECTED) {
				if(self.INTERSECTED.selectable)
				{
					var intersectedCubeIndex = self.getCubeModelIDByPosition(self.INTERSECTED.position.x, self.INTERSECTED.position.y, self.INTERSECTED.position.z);
					console.log("CubeMesh " + self.INTERSECTED.id + " clicked (model id: " + intersectedCubeIndex + ")" );
					this.serverRemoved = false;
					self.removeCube(intersectedCubeIndex);
					self.INTERSECTED = null;
				}
				else{
					if(this.realtime == false) if(self.turn != self.playerNumber) alert("It's not your turn!");
				}
			}
		}
	},

	serverRemovedCube: function(cubeID){
		console.log("removing cube: removed by server");
		Reductor.scene.remove(this.cubeViews[cubeID]);
		this.cubeViews.splice(cubeID, 1);
		var cubeModel = this.model.at(cubeID);
		//console.log("Before cube deletion: ");
		//this.logCubeModels();
		this.serverRemoved = true;
		this.model.remove(cubeModel);
		this.resetCubeIDs();
		//console.log("-------------------------------------\nAfter cube deletion:");
		//this.logCubeModels();
		this.render();
	},

	removeCube: function(cubeID){
		console.log("removing cube: removed by player");
		Reductor.scene.remove(this.cubeViews[cubeID]);
		this.cubeViews.splice(cubeID, 1);
		var cubeModel = this.model.at(cubeID);
		//console.log("Before cube deletion: ");
		//this.logCubeModels();
		this.serverRemoved = false;
		this.model.remove(cubeModel);
		this.resetCubeIDs();
		//console.log("-------------------------------------\nAfter cube deletion:");
		//this.logCubeModels();
		if(this.realtime == false) this.turn = (this.turn + 1) % 2;
		this.render();
	},

	resetCubeIDs: function(){
		for(var i = 0; i < this.model.length; i++)
		{
			var cube = this.model.at(i);
			cube.id = i;
			cube.set({id: i});
		}
	},

	onKeyDown: function(e){
		switch(e.keyCode)
		{
			case 37: // left
				e.preventDefault();
				if(!this.moving)
				{
					this.moving = true;
					this.currentAnimFrame = 0;
					this.movementDirection = this.LEFT;
				}
			break;

			case 38: // up
				e.preventDefault();
			break;

			case 39: // right
				e.preventDefault();
				if(!this.moving)
				{
					this.moving = true;
					this.currentAnimFrame = 0;
					this.movementDirection = this.RIGHT;
				}
			break;

			case 40: // down
				e.preventDefault();
			break;
		}

		window.requestAnimationFrame(this.render);
	},

	getIntersects: function(event)
	{
		if(event.target == this.renderer.domElement)
		{
			var mouseX = (event.clientX / window.innerWidth)*2-1;
			var mouseY = -(event.clientY /window.innerHeight)*2+1;

			var vector = new THREE.Vector3(mouseX, mouseY, 0.5);
			this.projector.unprojectVector(vector, this.camera);

			var raycaster = new THREE.Raycaster(this.camera.position, vector.sub(this.camera.position).normalize());
			var intersects = raycaster.intersectObjects(this.cubeViews);

			return intersects;
		}
		return null;
	},

	getCubeModelIDByPosition: function(x, y, z){
		for(var i=0; i<this.model.length; i++)
		{
			var cube = this.model.at(i);
			var position = cube.get('position');
			if(position.x == x && position.y == y && position.z == z)
			{
				return cube.id;
			}
		}
	},

	getCubeMeshIDByPosition: function(x, y, z){
		for(var i=0; i<this.cubeViews.length; i++)
		{
			var cube = this.cubeViews[i];
			var position = cube.position;
			if(position.x == x && position.y == y && position.z == z)
			{
				return cube.id;
			}
		}
	},

	getCubeViewByPosition: function(x, y, z){
		for(var i=0; i<this.cubeViews.length; i++)
		{
			var position = this.cubeViews[i].position;
			if (position.x == x && position.y == y && position.z == z)
			{
				return {index: i, cubeView: this.cubeViews[i]};
			}
		}
	},

	cubeIsSelectable: function(cube)
	{
		//console.log("this.turn: " + this.turn + ", this.playerNumber: " + this.playerNumber);
		if(this.realtime == true  && this.turn != this.playerNumber) {
			console.log("false: it's not your turn");
			return false;
		} else {
			var cubeModelIndex = this.getCubeModelIDByPosition(cube.position.x, cube.position.y, cube.position.z);
			var cubeModel = this.model.at(cubeModelIndex);
			var targetColour = this.colours[this.playerNumber];
			if(cubeModel.get('colour') != targetColour){
				//console.log("false: wrong colour");
				return false;
			} else if(Reductor.utils.cubeExistsAbove(cube.position.x, cube.position.y, cube.position.z, this.model)){
				//console.log("false: cube exists above this one");
				return false;
			} else {
				//console.log("true");
				return true;
			}
		}
	},

	logCubeModels: function()
	{
		for(var i=0; i<this.model.length; i++)
		{
			var cube = this.model.at(i);
			var position = cube.get('position');
			console.log("models[" + i + "]" + ": cube.id: " + cube.id + " | cube.get('id'): " + cube.get('id') + " | [" + position.x + ", " + position.y + ", " + position.z + "]");
		}
	}
});