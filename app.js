
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
	io = require('socket.io').listen(server, {log: false}),
	url = require('url');

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
	client.emit('playerURLRecieved', {url:client.id});

	client.on('startGame', function(data, callback){
		client.nickname = data.playerName;
		client.game = lobby.getGame();
		client.game.addPlayer({id:client.id, name:client.nickname});
		var playerNumber = client.game.connectedPlayers - 1;

		client.emit('connected', {gameModel: client.game.cubes, playerNumber:playerNumber, players:client.game.players, gameSize: client.game.size, colours:client.game.colours, turn:client.game.turn});
		var otherPlayerID = client.game.getOtherPlayerID(client.id);
		console.log(otherPlayerID);
		for(var i=0; i<clients.length; i++)
		{
			if(clients[i].id == otherPlayerID)
			{
				console.log(clients[i].nickname);
				clients[i].emit('playerJoined', {name: client.nickname});
			}
		}
	});

	client.on('cubeRemoved', function(data){
		console.log("cube removed: " + data.cubeID);
		client.game.deleteCube(data.cubeID);
		client.emit('turnChanged', {turn:client.game.turn});
		var otherPlayerID = client.game.getOtherPlayerID(client.id);
		console.log("otherPlayerID: " + otherPlayerID);
		for(var i=0; i<clients.length; i++)
		{
			console.log(clients[i].id);
			if(clients[i].id == otherPlayerID)
			{
				console.log("Emitting cubeRemoved and turn changed");
				clients[i].emit('modelCubeRemoved', {cubeID: data.cubeID});
				clients[i].emit('turnChanged', {turn:client.game.turn});
			}
		}
	});
	client.on('disconnect', function(){
		console.log(client.id + " has disconnected");
		if(client.game)
		{
			client.game.connectedPlayers--;
			var otherPlayerID = client.game.getOtherPlayerID(client.id);
			//console.log("Other player in game:", otherPlayerID);
			for(var i=0; i<clients.length; i++)
			{
				if(clients[i].id == client.id)
				{
					clients.splice(i, 1);
				}else if(clients[i].id == otherPlayerID)
				{
					//console.log("Emitting message to", clients[i].id);
					//console.log(clients[i]);
					clients[i].emit('otherPlayerQuit', {playerWhoQuit: client.id});
				}
			}
		}

		

		lobby.removeGame(client.game);
	})
});