
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
  io.set("polling duration", 10);
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

	var game = lobby.getGame();
	game.addPlayer();
	var playerNumber = game.connectedPlayers - 1;

	client.emit('connected', {gameModel: game.cubes, playerNumber:playerNumber, gameSize: game.size});
	
	/*socket.on('disconnect', function(){
		console.log(socket.id + " has disconnected");
		clients.splice(clients.indexOf(socket), 1);
		game.removePlayer();
		if(game.connectedPlayers == 0)
		{
			lobby.remove(game);
		}
	})*/
});