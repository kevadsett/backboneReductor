
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

var size = 10;
var cubes = [];
for(var i = 0; i < 25; i++)
{
	var cube = {id: i, position: new Vectors.Vector3D(Math.floor(Math.random() * size) - size/2, Math.floor(Math.random() * size), Math.floor(Math.random() * size)- size/2), colour: utils.getRandomColor()};
	cubes.push(cube);
}

app.get('/', function (req, res) {
  res.sendfile(__dirname + '/views/index.html');
});

/*var Lobby = require('./lobby.collection');
var lobby = new Lobby();*/
var clients = [];

io.sockets.on('connection', function (client) {
	console.log("new client: " + client.id);
	clients.push(client);
	console.log(cubes);
	/*lobby.getGame();
	var game = lobby.returnedGame;
	game.addPlayer();
	var playerNumber = game.get('connectedPlayers') - 1;
	clients.push(socket);
	console.log(game);
	console.log("playerNumber: " + playerNumber);*/
	client.emit('connected', {gameModel: cubes, playerNumber:clients.length-1, gameSize: size});
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