var CubeView = Backbone.View.extend({

	initialize: function(params){
		//console.log(params);
		this.material = new THREE.MeshLambertMaterial({color: this.model.colour});
		this.geometry = new THREE.CubeGeometry(1, 1, 1);
		this.mesh = new THREE.Mesh(this.geometry, this.material);
		this.mesh.position.x = this.model.position.x;
		this.mesh.position.y = this.model.position.y;
		this.mesh.position.z = this.model.position.z;
		this.scene = params.scene;
		_.bindAll(this, 'attributesChanged', 'addToScene', 'removeFromScene');
		this.bind('change', this.attributesChanged);
		this.addToScene();
	},
	attributesChanged: function(){
		this.trigger("colourChanged", this.get('colour'));
	},
	addToScene: function()
	{
		this.scene.add(this.mesh);
	},
	removeFromScene: function()
	{
		this.scene.remove(this.mesh);
	}
});