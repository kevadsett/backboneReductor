var socket = io.connect(window.location.hostname);

$(document).ready(function(e)
{
	socket.on('connected', function(data)
	{
		console.log("Connected to server. Client ID = " + data.id);

		var GameView = Backbone.View.extend({
			el: $('body'),
			initialize: function(params){
				this.scene = new THREE.Scene();
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

				var cameraDistance = Math.max(this.model.get('width'), this.model.get('height'), this.model.get('depth')) + 5;
				this.camera.position.set(cameraDistance, cameraDistance, cameraDistance);
				this.camera.lookAt(this.scene.position);
				_.bindAll(this, 'render', 'resizeCanvas','setupRenderer', 'initialiseCubeViews', 'createLights', 'onMouseMoved', 'onMouseDown', 'getIntersects', 'onKeyDown', 'getCubeIndexByPosition', 'getCubeViewByPosition', 'modelChanged');

				this.setupRenderer();
				this.resizeCanvas();
				this.initialiseCubeViews();
				this.createLights()
				this.render();

				this.model.bind('cubeRemoved', this.modelChanged);
			},

			initialiseCubeViews: function(){
				var playerCubes = this.model.get('playerCubes');
				for(var i=0; i < 2; i++)
				{
					for(var j=0; j < playerCubes[i].length; j++)
					{
						var cubeModel = playerCubes[i].models[j];
						var cubeView = new CubeView({model: cubeModel, scene: this.scene});
						this.cubeViews.push(cubeView.mesh);
					}
				}
			},

			createLights: function() {
				var vec1 = new THREE.Vector3(this.model.get('width'), this.model.get('height'), this.model.get('depth'));
				var vec2 = new THREE.Vector3(-this.model.get('width'), -this.model.get('height'), -this.model.get('depth'));

				var mainLight = new THREE.PointLight(0xFFFFFF, 1);
				mainLight.position.set(vec1.x, vec1.y, vec1.z);
				this.scene.add(mainLight);

				var subLight = new THREE.PointLight(0xFFFFFF, 1);
				subLight.position.set(vec2.x, vec2.y, vec2.z);
				this.scene.add(subLight);
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
						this.camera.lookAt(this.scene.position);
					}

				}
				this.lastTime = timeNow;
				this.renderer.render(this.scene, this.camera);
				var myKeyNumber = this.playerNumber;
				var otherKeyNumber = (this.playerNumber + 1) % 2;
				$('#key1').css({
					'background-color': this.model.get('colours')[myKeyNumber],
					'color': this.model.get('textColours')[myKeyNumber]
				});
				$('#keyText1').html(this.model.get('playerCubes')[myKeyNumber].length);

				$('#key2').css({
					'background-color': this.model.get('colours')[otherKeyNumber],
					'color': this.model.get('textColours')[otherKeyNumber]
				})
				$('#keyText2').html(this.model.get('playerCubes')[otherKeyNumber].length);

				if(this.moving) window.requestAnimationFrame(this.render);
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
								this.INTERSECTED.material.color.setHex(utils.HexStringToUint(this.INTERSECTED.currentHex));
								this.render();
							}
							this.INTERSECTED = intersects[0].object;
							this.INTERSECTED.currentHex = utils.UintToHexString(this.INTERSECTED.material.color.getHex());
							this.INTERSECTED.colourIndex = this.model.get('colours').indexOf(this.INTERSECTED.currentHex);
							if(this.cubeIsSelectable(this.INTERSECTED))
							{
								this.INTERSECTED.selectable = true;
								//var brighterColour = utils.increaseBrightness(this.INTERSECTED.currentHex, 40);
								//this.INTERSECTED.material.color.setHex(utils.HexStringToUint(brighterColour));
								this.INTERSECTED.material.color.setHex(0xFFFFFF);
								this.render();
							}
						}
					}
				else
					{
						if(this.INTERSECTED)
						{
							this.INTERSECTED.material.color.setHex(utils.HexStringToUint(this.INTERSECTED.currentHex));
							this.render();
						}

						this.INTERSECTED = null;
					}
				}
				
			},
			onMouseDown: function(event)
			{
				event.preventDefault();
				if (this.INTERSECTED) {
					if(this.INTERSECTED.selectable)
					{
						var intersectedCubeIndex = this.getCubeIndexByPosition(this.INTERSECTED.position.x, this.INTERSECTED.position.y, this.INTERSECTED.position.z);
						var cubes = this.model.get('cubes');
						var intersectedCubeModel =cubes.models[intersectedCubeIndex];
						this.model.removeCube(intersectedCubeModel);
						this.INTERSECTED = null;
					}
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

			getCubeIndexByPosition: function(x, y, z){
				var cubes = this.model.get('cubes');
				for(var i=0; i<cubes.length; i++)
				{
					var cube = cubes.models[i];
					var position = cube.position;
					if(position.x == x && position.y == y && position.z == z)
					{
						return i;
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
				var position = cube.position;
				var cubes = this.model.get('cubes');
				var cubeIndex = this.getCubeIndexByPosition(position.x, position.y, position.z);
				var cubeModel = this.model.get('cubes').models[cubeIndex];
				var targetColour = this.model.get('colours')[this.playerNumber];
				if(cubeModel.colour != targetColour){
					return false;
				}
				if(utils.cubeExistsAbove(position.x, position.y, position.z, this.model.get('cubes'))){
					return false;
				}
				return true;
			},

			modelChanged: function(cubeRemoved)
			{
				var position = cubeRemoved.position;
				var cubeViewData = this.getCubeViewByPosition(position.x, position.y, position.z);
				var i = cubeViewData.i;
				var cube = cubeViewData.cubeView;
				this.scene.remove(cube);
				//this.model.splice(i, 1);
				//var cube = this.cubeViews(i);
				this.cubeViews.splice(i, 1);
				this.render();
			}


		});

		var gameModel = new GameModel(data.game);
		var gameView = new GameView({model:gameModel, playerNumber: data.playerNumber});
	});
});