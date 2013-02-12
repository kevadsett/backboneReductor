
/**
 * Module dependencies.
 */

var express = require('express'),
	routes = require('./routes'),
	http = require('http'),
	app = express(),
	port = process.env.PORT || 5000,
	server = http.createServer(app),
	io = require('socket.io').listen(server, {log: false}),
	Seed = require('seed'),
	Vectors = require('./public/js/Vectors'),
	Utils = require('./public/js/Utils'),
	Backbone = require('backbone'),
	_ = require('underscore')._;

server.listen(port);
console.log("Express server listening on port %d in %s mode", server.address().port, app.settings.env);

// Configuration

app.configure(function() {
  app.set('views', __dirname + '/views');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function() {
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function() {
  app.use(express.errorHandler());
});

// Heroku won't actually allow us to use WebSockets
// so we have to setup polling instead.
// https://devcenter.heroku.com/articles/using-socket-io-with-node-js-on-heroku
io.configure(function () {
  io.set("transports", ["xhr-polling"]);
  io.set("polling duration", 10);
});

// Routes

app.get('/', function (req, res) {
  res.sendfile(__dirname + '/views/index.html');
});

/*var Lobby = require('./lobby.collection');
var lobby = new Lobby();
var clients = [];*/

Cube = Seed.Model.extend('cube', {
  schema: new Seed.Schema({
    position: Object,
    colour: String
  })
});

Cubes = Seed.Graph.extend({
  initialize: function () {
    this.define(Cube);
  }
});

var db = new Cubes()
  , guid = new Seed.ObjectId();
  var utils = new Utils();
for(var i = 0; i < 100; i++)
{
	var cube = {position: new Vectors.Vector3D({x:Math.floor(Math.random() * 5), y:Math.floor(Math.random() * 5), z:Math.floor(Math.random() * 5)}), colour: utils.getRandomColor()};
	db.set('/cube/' + i, cube);
}
io.sockets.on('connection', function (socket) {
console.log("client connected");

	socket.on('cubecollection:create', function (data, callback) {
		var id = guid.gen()
			, cube = db.set('/cube/' + id, data)
			, json = cube._attributes;

		socket.emit('todos:create', json);
		socket.broadcast.emit('todos:create', json);
		callback(null, json);
	});

	socket.on('cubecollection:read', function (data, callback) {
		console.log("fetching cubes");
		var list = [];

		db.each('cube', function (cube) {
			list.push(cube._attributes);
		});
		
		callback(null, list);
	});

	socket.on('cubecollection:update', function (data, callback) {
		var cube = db.get('/cube/' + data.id);
		cube.set(data);

		var json = cube._attributes;

		socket.emit('cubecollection/' + data.id + ':update', json);
		socket.broadcast.emit('cubecollection/' + data.id + ':update', json);
		callback(null, json);
	});

	socket.on('cubecollection:delete', function (data, callback) {
		var json = db.get('/todo/' + data.id)._attributes;

		db.del('/cube/' + data.id);

		socket.emit('cubecollection/' + data.id + ':delete', json);
		socket.broadcast.emit('cubecollection/' + data.id + ':delete', json);
		callback(null, json);
	});

	/*console.log("new client: " + socket.id);
	lobby.getGame();
	var game = lobby.returnedGame;
	game.addPlayer();
	var playerNumber = game.get('connectedPlayers') - 1;
	clients.push(socket);
	console.log(game);
	console.log("playerNumber: " + playerNumber);
	socket.emit('connected', {game: game, playerNumber:playerNumber});
	socket.on('disconnect', function(){
		console.log(socket.id + " has disconnected");
		clients.splice(clients.indexOf(socket), 1);
		game.removePlayer();
		if(game.connectedPlayers == 0)
		{
			lobby.remove(game);
		}
	})*/
});