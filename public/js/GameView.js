
// usage: log('inside coolFunc', this, arguments);
// paulirish.com/2009/log-a-lightweight-wrapper-for-consolelog/
window.log = function(){
  log.history = log.history || [];   // store logs to an array for reference
  log.history.push(arguments);
  if(this.console) {
    arguments.callee = arguments.callee.caller;
    var newarr = [].slice.call(arguments);
    (typeof console.log === 'object' ? log.apply.call(console.log, console, newarr) : console.log.apply(console, newarr));
  }
};

window.socket = io.connect(window.location.hostname);

log(window.socket);

// use the 'Reductor' namespace
var Reductor = {};

/**
 * App#Router
 * 
 * There is only one route in this app. It creates the new 
 * CubeCollection collection then passes it to the views.
 * 
 * Then append the views to our page.
 */

Reductor.App = Backbone.Router.extend({
	routes: {
		'': 'index',
		'/': 'index'
	},
	index: function () {
		var cubes = new Reductor.CubeCollection();

		// need to implement views once models are working
		/*var form = new Minimal.TodoListForm(cubes);
		var list = new Minimal.TodoList(cubes);*/

		cubes.fetch();
		console.log(cubes);
	}
});

/**
 * CubeModel#Model
 * 
 * The cube model will bind to the servers `update` and
 * `delete` events. We broadcast these events on the completion
 * and removing of an event.
 * 
 * The `noIoBind` default value of false so that models that
 * are created via the collection are bound.
 * 
 */

Reductor.CubeModel = Backbone.Model.extend({
	urlRoot:'cube',
	noIoBind: false,
	socket:window.socket,
	initialize: function(){
		_.bindAll(this, 'serverChange', 'serverDelete', 'modelCleanup');

		/*!
		 * if we are creating a new model to push to the server we don't want
		 * to iobind as we only bind new models from the server. This is because
		 * the server assigns the id.
		 */
		if (!this.noIoBind) {
		  this.ioBind('update', this.serverChange, this);
		  this.ioBind('delete', this.serverDelete, this);
		}
	},
	serverChange: function (data) {
		// Useful to prevent loops when dealing with client-side updates (ie: forms).
		data.fromServer = true;
		this.set(data);
	},
	serverDelete: function (data) {
		if (this.collection) {
			this.collection.remove(this);
		} else {
			this.trigger('remove', this);
		}
		this.modelCleanup();
	},
	modelCleanup: function () {
		this.ioUnbindAll();
		return this;
	}
});

/**
 * CubeCollection#Collection
 * 
 * The collection responds to `create` events from the 
 * server. When a new cube is created, the cube is broadcasted
 * using socket.io upon creation.
 */

Reductor.CubeCollection = Backbone.Collection.extend({
	model:Reductor.CubeModel,
	url:'cubecollection',
	socket:window.socket,
	initialize: function(){
		_.bindAll(this, 'serverCreate', 'collectionCleanup');
		this.ioBind('create', this.serverCreate, this);
	},
	serverCreate: function (data) {
	// make sure no duplicates, just in case
		var exists = this.get(data.id);
		if (!exists) {
			this.add(data);
		} else {
			data.fromServer = true;
			exists.set(data);
		}
	},
	collectionCleanup: function (callback) {
		this.ioUnbindAll();
		this.each(function (model) {
			model.modelCleanup();
		});
		return this;
	}
});

// When the page is ready, create a new app and trigger the router.
$(document).ready(function () {
  window.app = new Reductor.App();
  Backbone.history.start();
});