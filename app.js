// requirement
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

// const settings
var gameSettings = {
	low : 200,
	high : 600,
	width: 4000,
	height: 4000,
	itemNum: 100,
};

// all lists
var playerList = [];
var pickupList = [];
var flyingList = [];

function findById(id_list) {
	return function(id){
		for (var x of id_list) {
			if (x.id == id)
				return x;
		}
		return null;
	}
}

var findPlayerId = findById(playerList);
var findPickupId = findById(pickupList);
var findFlyingId = findById(flyingList);

//game object class in the server
var GameObject = function(startX, startY, id, name) {
	this.x = startX;
	this.y = startY;
	this.id = id;
	this.name = name;
}

GameObject.prototype = {
	playerInfo: function() {
		return {
			x: this.x,
			y: this.y,
			id: this.id,
			name: this.name,
			health: this.health,
			maxHealth: this.maxHealth,
		}
	},
	pickupInfo: function() {
		return {
			x: this.x,
			y: this.y,
			id: this.id,
			name: this.name,
		}
	},
	flyingInfo: function() {
		return {
			x: this.x,
			y: this.y,
			id: this.id,
			name: this.name,
			rotation: this.rotation,
			owner: this.owner,
			attack: this.attack,
		}
	},
	flyingInfo1: function() {
		return {
			x: this.x,
			y: this.y,
			id: this.id,
			name: this.name,
			owner: this.owner,
			attack: this.attack,
		}
	},
};

// heartBeat checking
setInterval(heartBeat, 1000/60);

function heartBeat () {
	var generatenum = gameSettings.itemNum - pickupList.length; 
	addElement(generatenum);
}

// add element
function addElement(n) {
	//return if it is not required to create food 
	if (n <= 0) {
		return;
	}	
	
	for (var i = 0; i < n; i++) {
		//create the unique id using node-uuid
		let uniqueId = unique.v4();
		let {x, y} = randomGenerate(gameSettings.width, gameSettings.height);
		let element = new GameObject(x, y, uniqueId, randomInt(0, 4));
		pickupList.push(element);
		//set the food data back to client
		io.emit("new_pickup", element.pickupInfo());
	}
}

// for generate things randomly
function randomGenerate(x, y) {
	return {x: randomInt(10, x - 10), y: randomInt(10, y - 10)};
}

function randomInt (low, high) {
    return Math.floor(Math.random() * (high - low + 1) + low);
}

// on events
function onNewplayer (data) {
	//new player instance
	var {x, y} = randomGenerate(gameSettings.low, gameSettings.high);
	var newPlayer = new GameObject(x, y, this.id, data.name);
	console.log("created new player with id " + this.id);

	//send to the new player about everyone who is already connected.
	var that = this;
	playerList.forEach(function(player) {
		that.emit("new_enemy", player.playerInfo());
	});
	pickupList.forEach(function(pickup) {
		that.emit("new_pickup", pickup);
	});
	//send message to every connected client except the sender
	this.broadcast.emit('new_enemy', newPlayer.playerInfo());

	playerList.push(newPlayer);
	this.emit("create_player", newPlayer.playerInfo());
}

function removePlayer() {
	var currentPlayer = findPlayerId(this.id);

	if (currentPlayer) {
		playerList.splice(playerList.indexOf(currentPlayer), 1);
	}
	console.log("removing player " + this.id);
	//send message to every connected client except the sender
	this.broadcast.emit('remove_player', {id: this.id});
}

function onHit(data) {
	var movePlayer = findPlayerId(this.id);
	var flying = findFlyingId(data.id);
	//console.log(this.id, data.id);
	if (!movePlayer || !flying)
		return;
	io.emit("player_hit", {playerId: this.id, flyingId: data.id});
}

function onHpGet(data) {
	var currentPlayer = findPlayerId(this.id);
	if (!currentPlayer)
		return;
	data.id = this.id;
	io.emit("player_hp_change", data);
}

function pickUp(playerId, pickupId) {
	var player = findPlayerId(playerId);
	var pickup = findPickupId(pickupId);
	if (!player || !pickup)
		return;
	//console.log(this.id, data.id);
	pickupList.splice(pickupList.indexOf(pickup), 1);
	io.emit("player_pickup", {playerId: playerId, pickupId: pickupId});
}

function newFire(playerId, data) {
	var uniqueId = unique.v4();
	if (data.fireName == 0) {
		let flying = new GameObject(data.x, data.y, uniqueId, 0);
		flying.rotation = data.rotation;
		flying.attack = data.attack;
		flying.owner = playerId;
		flyingList.push(flying);
		io.emit('new_flying', flying.flyingInfo());
	} else {
		let flying = new GameObject(data.worldX, data.worldY, uniqueId, 1);
		flying.attack = data.attack;
		flying.owner = playerId;
		flyingList.push(flying);
		io.emit('new_flying', flying.flyingInfo1());
	}
}

function onPlayerStateChanged(data){
	var movePlayer = findPlayerId(this.id);
	if(!movePlayer){
		//console.log("cannot find moved player");
		return;
	}
	var currentData = {
		id: this.id,
		x : data.x,
		y : data.y,
		rotation: data.rotation,
	};
	//console.log("where is enemy", currentData);
	this.broadcast.emit('enemy_state_change', currentData);
	if (data.pickId) {
		pickUp(this.id, data.pickId);
	}
	if (data.fire) {
		newFire(this.id, data);
		//console.log(data);
	}
}

 // io connection
var io = require('socket.io')(serv,{});
io.sockets.on('connection', function(socket){
	console.log("socket connected");

	// listen for disconnection;
	socket.on('disconnect', removePlayer);
	socket.on('kill', removePlayer);
	// listen for new player
	socket.on("my_player", onNewplayer);
	socket.on("input_control", onPlayerStateChanged);
	socket.on("player_hit", onHit);
	socket.on("hp_get", onHpGet);
});
