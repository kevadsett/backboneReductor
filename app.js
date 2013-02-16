
/**
 * Module dependencies.
 */

var express = require('express'),
	routes = require('./routes'),
	http = require('http'),
	app = express(),
	port = process.env.PORT || 5000,
	server = http.createServer(app),
	Vectors = require('./public/js/Vectors'),
	Utils = require('./public/js/Utils'),
	io = require('socket.io').listen(server, {log: false});

var utils = new Utils();
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
  io.set("polling duration", 15);
});

// Routes


app.get('/', function (req, res) {
  res.sendfile(__dirname + '/views/index.html');
});

var Lobby = require('./Lobby');
var lobby = new Lobby();
lobby.getGame();
var clients = [];

io.sockets.on('connection', function (client) {
	console.log("new client: " + client.id);
	clients.push(client);

	client.game = lobby.getGame();
	client.game.addPlayer(client.id);
	var playerNumber = client.game.connectedPlayers - 1;

	client.emit('connected', {gameModel: client.game.cubes, playerNumber:playerNumber, gameSize: client.game.size, colours:client.game.colours});

	client.on('cubeRemoved', function(data){
		console.log("cube removed: " + data.cubeID);
		client.game.deleteCube(data.cubeID);
		var otherPlayerID = client.game.getOtherPlayer(client.id);
		for(var i=0; i<clients.length; i++)
		{
			if(clients[i].id == otherPlayerID)
			{
				clients[i].emit('modelCubeRemoved', {cubeID: data.cubeID});
			}
		}
	});
	client.on('disconnect', function(){
		console.log(client.id + " has disconnected");
		client.game.connectedPlayers--;
		var otherPlayerID = client.game.getOtherPlayer(client.id);
		console.log("Other player in game:", otherPlayerID);
		for(var i=0; i<clients.length; i++)
		{
			if(clients[i].id == otherPlayerID)
			{
				console.log("Emitting message to", clients[i].id);
				console.log(clients[i]);
				clients[i].emit('otherPlayerQuit', {playerWhoQuit: client.id});
			}
		}

		clients.splice(clients.indexOf(client.id), 1);

		lobby.removeGame(client.game);
	})
});