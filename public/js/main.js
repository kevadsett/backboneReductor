var socket = io.connect(window.location.hostname);

$(document).ready(function(e)
{
	socket.on('connected', function(data)
	{
		console.log("Connected to server. playerNumber = " + data.playerNumber);
		
		var cubeCollection = new CubeCollection(data.gameModel);
		var gameView = new GameView({model:cubeCollection});
	});
});