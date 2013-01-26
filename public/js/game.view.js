var socket = io.connect(window.location.hostname);

$(document).ready(function(e)
{
	socket.on('connected', function(data)
	{

		//window.addEventListener( 'resize', gameView.onWindowResize, false );
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

				var cameraDistance = Math.max(this.model.get('width'), this.model.get('height'), this.model.get('depth')) + 5;
				this.camera.position.set(cameraDistance, cameraDistance, cameraDistance);
				this.camera.lookAt(this.scene.position);
				_.bindAll(this, 'render', 'resizeCanvas','setupRenderer', 'initialiseCubeViews', 'createLights', 'onMouseMoved', 'getIntersects');
				this.setupRenderer();
				//this.resizeCanvas();
				this.initialiseCubeViews();
				this.createLights()
				this.render();
			},

			initialiseCubeViews: function(){
				var playerCubes = this.model.get('playerCubes');
				for(var i=0; i < 2; i++)
				{
					for(var j=0; j < playerCubes[i].length; j++)
					{
						var cubeModel = playerCubes[i].models[j];
						this.cubeViews.push(new CubeView({model: cubeModel, scene: this.scene}));
						this.scene.add(this.cubeViews[this.cubeViews.length-1].mesh);
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
				/*this.renderer.domElement.addEventListener( 'mousedown', this.onDocumentMouseDown, false );*/
				console.log("this.renderer.domElement: " + this.renderer.domElement);
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
							this.camera.position.x = this.camX * Math.cos(this.rotSpeed) - this.camZ * Math.sin(this.rotSpeed) * elapsed;
							this.camera.position.z = this.camZ * Math.cos(this.rotSpeed) + this.camX * Math.sin(this.rotSpeed) * elapsed;
						}
						else if (this.movementDirection == this.RIGHT)
						{
							this.camera.position.x = this.camX * Math.cos(this.rotSpeed) + this.camZ * Math.sin(this.rotSpeed) * elapsed;
							this.camera.position.z = this.camZ * Math.cos(this.rotSpeed) - this.camX * Math.sin(this.rotSpeed) * elapsed;
						}
						this.currentAnimFrame++;
						this.camera.lookAt(this.scene.position);
					}


				}
				this.lastTime = timeNow;
				this.renderer.render(this.scene, this.camera);

				window.requestAnimationFrame(this.render);
			},

			resizeCanvas: function(){
				var canvas = this.el;
				canvas.width = window.innerWidth;
				canvas.height = window.innerHeight;
				this.render();
			},

			/*events:{
				"mouseover": "onMouseMoved",
			},*/

			onMouseMoved: function(event){
				event.preventDefault();
				var intersects = this.getIntersects(event);
				/*if ( intersects ) {
					if(intersects.length > 0)
					{
						if(GameView.prototype.INTERSECTED != intersects[ 0 ].object)
						{
							if(GameView.prototype.INTERSECTED)
							{
								GameView.prototype.INTERSECTED.material.color.setHex(utils.HexStringToUint(GameView.prototype.INTERSECTED.currentHex));
							}
							GameView.prototype.INTERSECTED = intersects[0].object;

							GameView.prototype.INTERSECTED.currentHex = utils.UintToHexString(GameView.prototype.INTERSECTED.material.color.getHex());
							GameView.prototype.INTERSECTED.colourIndex = GameView.prototype.colours.indexOf(GameView.prototype.INTERSECTED.currentHex);
							if(utils.cubeIsSelectable(GameView.prototype.INTERSECTED))
							{
								GameView.prototype.INTERSECTED.selectable = true;
								var brighterColour = utils.increaseBrightness(GameView.prototype.INTERSECTED.currentHex, 40);
								GameView.prototype.INTERSECTED.material.color.setHex(utils.HexStringToUint(brighterColour));
							}
						}
					}
				}
				else
				{
					if(GameView.prototype.INTERSECTED)
					{
						GameView.prototype.INTERSECTED.material.color.setHex(utils.HexStringToUint(GameView.prototype.INTERSECTED.currentHex));
					}

					GameView.prototype.INTERSECTED = null;
				}*/
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
			}


		});

		var gameModel = new GameModel(data);
		console.log(data);
		var gameView = new GameView({model:gameModel});
		//console.log(data);
		/*$('#key1').css({
			'background-color': data.colours[0],
			'color': data.textColours[0]
		});
		$('#keyText1').html(data.playerCubes[0]);

		$('#key2').css({
			'background-color': data.colours[1],
			'color': data.textColours[1]
		})
		$('#keyText2').html(data.playerCubes[0]);*/
	});
});