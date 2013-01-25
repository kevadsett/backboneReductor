
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

var GameModel = require('./public/js/game.model.backbone');
var gameModel = new GameModel({height:2,width:2,depth:2});
console.log("Created new game model");
//console.log(gameModel);
var clients = [];

io.sockets.on('connection', function (socket) {
	clients.push(socket);
	console.log("new client: " + socket.id);
	var data = {
		id:socket.id,
		colours: gameModel.get('colours'),
		textColours: gameModel.get('textColours'),
		playerCubes: gameModel.get('playerCubes'),
		cubePositions: gameModel.get('cubePositions'),
		cubeColours: gameModel.get('cubeColours'),
		totalCubes: gameModel.get('totalCubes'),
		w: gameModel.get('width'),
		h: gameModel.get('height'),
		d: gameModel.get('depth')
	};
	console.log(data);
	socket.emit('connected', data);
});