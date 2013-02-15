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

		var cameraDistance = this.model.size + 5;
		this.camera.position.set(cameraDistance, cameraDistance, cameraDistance);
		this.camera.lookAt(Reductor.scene.position);
		_.bindAll(this, 'render', 'resizeCanvas','setupRenderer', 'initialiseCubeViews', 'createLights', 'onMouseMoved', 'onMouseDown', 'removeCube', 'getIntersects', 'onKeyDown', 'getCubeMeshIDByPosition', 'getCubeModelIDByPosition',  'getCubeViewByPosition');

		this.setupRenderer();
		this.resizeCanvas();
		this.initialiseCubeViews();
		this.createLights()
		this.render();

		this.model.bind('remove', this.cubeRemoved, this);
		var self = this;
		window.socket.on('modelCubeRemoved', function(data){
			console.log("Server cube removed. Model ID: " + data.cubeID);
			self.removeCube(data.cubeID, true);
		});
	},

	cubeRemoved: function(options){
		console.log("Sending ID: " + options.id + " to server");
		window.socket.emit('cubeRemoved', {cubeID: options.id});
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
		$('#key1').css({
			'background-color': this.colours[myKeyNumber],
			'color': textColours[myKeyNumber]
		});
		$('#keyText1').html(this.getPlayerCubes(myKeyNumber).length);

		$('#key2').css({
			'background-color': this.colours[otherKeyNumber],
			'color': textColours[otherKeyNumber]
		})
		$('#keyText2').html(this.getPlayerCubes(otherKeyNumber).length);

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
					console.log(this.INTERSECTED.id + ": {" + this.INTERSECTED.position.x, this.INTERSECTED.position.y, this.INTERSECTED.position.z + "}");
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
		if (self.INTERSECTED) {
			if(self.INTERSECTED.selectable)
			{
				var intersectedCubeIndex = self.getCubeModelIDByPosition(self.INTERSECTED.position.x, self.INTERSECTED.position.y, self.INTERSECTED.position.z);
				console.log("CubeMesh " + self.getCubeMeshIDByPosition(self.INTERSECTED.position.x, self.INTERSECTED.position.y, self.INTERSECTED.position.z) + " clicked (model id: " + intersectedCubeIndex + ")" );
				self.removeCube(intersectedCubeIndex, false);
				self.INTERSECTED = null;
			}
		}
	},

	removeCube: function(cubeID, removedByServer){
		var cubeMeshID = cubeID;
		//console.log("this.model.at(" + cubeID + ") position: ");
		//console.log(this.model.at(cubeID).get('position'));
		if(removedByServer == undefined) removedByServer = false;
		//console.log("this.cubeViews[" + cubeMeshID + "] position:");
		//console.log(this.cubeViews[cubeMeshID].position);
		Reductor.scene.remove(this.cubeViews[cubeMeshID]);
		//console.log("this.cubeViews[" + cubeMeshID + "] position:");
		//console.log(this.cubeViews[cubeMeshID].position);
		this.cubeViews.splice(cubeMeshID, 1);
		var cubeModel = this.model.at(cubeID);
		if(!removedByServer) this.model.remove(cubeModel);
		this.render();
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
		console.log("getCubeModelIDByPosition: ", x, y, z);
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
			console.log(i + ": [" + position.x + ", " + position.y + ", " + position.z + "]");
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
		console.log("cubeIsSelectable");
		console.log("cubeMesh: " + cube.id + " position");
		console.log(cube.position);
		var cubeModel = this.model.at(this.getCubeModelIDByPosition(cube.position.x, cube.position.y, cube.position.z));
		console.log("cubeModel " + cubeModel.id + " position");
		console.log(cubeModel.get('position'));
		var targetColour = this.colours[this.playerNumber];
		if(cubeModel.get('colour') != targetColour){
			console.log("false: wrong colour");
			return false;
		}
		if(Reductor.utils.cubeExistsAbove(cube.position.x, cube.position.y, cube.position.z, this.model)){
			console.log("false: cube exists above this one");
			return false;
		}
		console.log("true");
		return true;
	}
});