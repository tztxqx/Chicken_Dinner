var express = require('express');
var unique = require('node-uuid');

var app = express();
var serv = require('http').Server(app);


app.get('/',function(req, res) {
	res.sendFile(__dirname + '/client/index.html');
});
app.use('/client',express.static(__dirname + '/client'));
app.use('/node_modules',express.static(__dirname + '/node_modules'));

serv.listen(process.env.PORT || 2000);
console.log("Server started.");

var player_lst = [];
var item_lst = [];
var randomRange = {
	low : 200,
	high : 600,
	mapWidth: 4000,
	mapHeight: 4000,
};
var gameSettings = {
	item_num : 100
};

//a player class in the server
var Player = function (startX, startY, name) {
  this.x = startX;
  this.y = startY;
  this.id;
  this.name = name;
  this.sendData = true;
}

Player.prototype = {
	canSendData: function() {
		if (this.sendData) {
			var that = this;
			this.sendData = false;
			setTimeout(function(){that.sendData = true}, 50);
			return true;
		} else {
			return false;
		}
	}
};

var Element = function (max_x, max_y, id) {
	this.x = randomInt(10, max_x - 10);
	this.y = randomInt(10, max_y - 10);
	this.id = id;
};

setInterval(heartbeat, 1000/60);

function heartbeat () {
	var generatenum = gameSettings.item_num - item_lst.length; 
	addElement(generatenum);
}

function addElement(n) {
	//return if it is not required to create food 
	if (n <= 0) {
		return;
	}	
	
	for (var i = 0; i < n; i++) {
		//create the unique id using node-uuid
		var unique_id = unique.v4(); 
		var element = new Element(randomRange.mapWidth, randomRange.mapHeight, unique_id);
		item_lst.push(element);
		//set the food data back to client
		//console.log("generate element");
		io.emit("item_update", element);
	}
}

//for finding the id of the enemy
function find_playerid(id) {
	for (var i = 0; i < player_lst.length; i++) {

		if (player_lst[i].id == id) {
			return player_lst[i];
		}
	}
	return false;
}

function find_itemid(id) {
	for (var i = 0; i < item_lst.length; i++) {
		if (item_lst[i].id == id) {
			return item_lst[i];
		}
	}
	return false;
}

//for generate things randomly
function randomInt (low, high) {
    return Math.floor(Math.random() * (high - low) + low);
}

function onNewplayer (name) {
	//new player instance
	var newPlayer = new Player(randomInt(randomRange.low, randomRange.high, name), 
		randomInt(randomRange.low, randomRange.high));
	console.log(newPlayer);
	console.log("created new player with id " + this.id);
	newPlayer.id = this.id;

	//information to be sent to all clients except sender
	var current_info = {
		id: newPlayer.id,
		x: newPlayer.x,
		y: newPlayer.y,
		name: newPlayer.name
	};

	//send to the new player about everyone who is already connected.
	for (i = 0; i < player_lst.length; i++) {
		existingPlayer = player_lst[i];
		var player_info = {
			id: existingPlayer.id,
			name: newPlayer.name,
			x: existingPlayer.x,
			y: existingPlayer.y,
		};
		console.log("pushing player");
		//send message to the sender-client only
		this.emit("new_enemyPlayer", player_info);
	}
	var that = this;
	item_lst.forEach(function(element) {
		that.emit("item_update", element);
	});
	console.log('emit_create');
	//send message to every connected client except the sender
	this.broadcast.emit('new_enemyPlayer', current_info);

	player_lst.push(newPlayer);
	this.emit("create_player", current_info);
	console.log(player_lst);
}


function onClientdisconnect() {
	console.log('disconnect');

	var removePlayer = find_playerid(this.id);

	if (removePlayer) {
		player_lst.splice(player_lst.indexOf(removePlayer), 1);
	}

	console.log("removing player " + this.id);

	//send message to every connected client except the sender
	this.broadcast.emit('remove_player', {id: this.id});
}

function onTemporary(data) {
	var movePlayer = find_playerid(this.id);
	var enemyPlayer = find_playerid(data.id);
	//console.log(this.id, data.id);
	if (!movePlayer || !enemyPlayer)
		return;
	if (movePlayer.dead || enemyPlayer.dead)
		return;
	io.emit("player_hurt", {id: this.id, damage: 10});
}

function onPickup(data) {
	var movePlayer = find_playerid(this.id);
	var element = find_itemid(data.id);
	//console.log(this.id, data.id);
	io.emit("player_hurt", {id: this.id, damage: -10});
	io.emit("remove_item", {id: data.id});
}

function onPlayerStateChanged(data){
	var movePlayer = find_playerid(this.id);
	if(!movePlayer){
		console.log("cannot find moved player");
		return;
	}
	console.log(movePlayer.sendData);
	if (!movePlayer.canSendData()) {
		return;
	}
	var current_id = this.id;
	var current_data ={
		id: current_id,
		x : data.x,
		y : data.y,
		rotation: data.rotation,
	};
	//console.log("where is enemy", current_data);
	this.broadcast.emit('enemy_state_change', current_data);
}

 // io connection
var io = require('socket.io')(serv,{});
io.sockets.on('connection', function(socket){
	console.log("socket connected");

	// listen for disconnection;
	socket.on('disconnect', onClientdisconnect);
	// listen for new player
	socket.on("my_player", onNewplayer);
	socket.on("input_control", onPlayerStateChanged);
	socket.on("player_collision", onTemporary);
	socket.on("item_picked", onPickup);
});
