window.socket = io.connect(window.location.hostname);

// use the 'Reductor' namespace
var Reductor = {};
Reductor.App = Backbone.Router.extend({
	routes: {
		'': 'index',
		'/': 'index'
	},
	index: function () {
		var cubes = new CubeCollection();

		/*var form = new Minimal.TodoListForm(cubes);
		var list = new Minimal.TodoList(cubes);*/

		cubes.fetch();
		console.log(cubes);
	}
});

$(document).ready(function(e)
{
		window.app = new Reductor.App();
		Backbone.history.start();
});