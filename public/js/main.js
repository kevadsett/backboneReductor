var socket = io.connect(window.location.hostname);
var names = ["The Block Destroyer", "Beelzeblock", "Reductotron", "The Reducer", "Clicky person"];
$(document).ready(function(e)
{
	var playerURL = '#';
	socket.on('playerURLRecieved', function(data){
		playerURL += data.url;
		console.log(playerURL);
	});

	function submitForm(event){
		event.preventDefault();
		playerURL = window.location + playerURL;
		var playerName = $('#nameText').val() || names[Math.floor(Math.random() * names.length)];
		socket.emit('startGame', {playerName:playerName});
	}

	socket.on('connected', function(data)
	{
		console.log("Connected to server. playerNumber = " + data.playerNumber);
		$('#login').addClass("invisible");
		$('#keys').removeClass("invisible");
		$('#instructions').removeClass("invisible");
		$('#turnText').removeClass("invisible");
		var cubeCollection = new CubeCollection(data.gameModel);
		cubeCollection.size = data.gameSize;
		var gameView = new GameView({model:cubeCollection, colours:data.colours, playerNumber:data.playerNumber, players:data.players, turn:data.turn});
	});

	$('#nameText').bind("enterKey", function(e){
		submitForm(e);
	});

	$('#nameText').keydown(function(e){
		if(e.keyCode == 13)
		{
			e.preventDefault();
			$(this).trigger("enterKey");
		}
	});

	$('#loginForm').bind('submit', function(e){
		submitForm(e);
	});
});