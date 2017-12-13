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

function inList(a, b) {
	return (b.indexOf(a) != -1) ? true : false;
}

//game object class in the server
class GameObject {
	constructor(startX, startY, id, name) {
		this.x = startX;
		this.y = startY;
		this.id = id;
		this.name = name;
	}

	Info() {
	}
}

class Player extends GameObject {
	constructor(info) {
		super(info.x, info.y, info.id, info.name);
		this.health = info.health;
		this.maxHealth = info.maxHealth;
	}

	Info() {
		return {
			x: this.x,
			y: this.y,
			id: this.id,
			name: this.name,
			health: this.health,
			maxHealth: this.maxHealth,
		};
	}
}

class Pickup extends GameObject {
	constructor(info) {
		super(info.x, info.y, info.id, info.name);
	}

	Info() {
		return {
			x: this.x,
			y: this.y,
			id: this.id,
			name: this.name,
		};
	}
}

class Flying extends GameObject {
	constructor(info) {
		super(info.x, info.y, info.id, info.name);
		this.owner = info.owner;
		this.attack = info.attack;
		if (inList(this.name, [0, 2])) {
			this.rotation = info.rotation;
		}
	}

	Info() {
		let info = {
			x: this.x,
			y: this.y,
			id: this.id,
			name: this.name,
			owner: this.owner,
			attack: this.attack,
		};
		if (inList(this.name, [0, 2])) {
			info.rotation = this.rotation;
		}
		return info;
	}
}

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
		let element = new Pickup({x: x, y: y, id: uniqueId, name: randomInt(0, 4)});
		pickupList.push(element);
		//set the food data back to client
		io.emit("new_pickup", element.Info());
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
	var newPlayer = new Player({
		x: x,
		y: y,
		id: this.id,
		name: data.name,
		health: 100,
		maxHealth: 100,
	});
	console.log("created new player with id " + this.id);

	//send to the new player about everyone who is already connected.
	var that = this;
	playerList.forEach(function(player) {
		that.emit("new_enemy", player.Info());
	});
	pickupList.forEach(function(pickup) {
		that.emit("new_pickup", pickup.Info());
	});
	//send message to every connected client except the sender
	this.broadcast.emit('new_enemy', newPlayer.Info());

	playerList.push(newPlayer);
	this.emit("create_player", newPlayer.Info());
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
	if (inList(data.fireName, [0, 2])) {
		var flying = new Flying({
			x: data.x,
			y: data.y,
			id: uniqueId,
			name: data.fireName,
			rotation: data.rotation,
			attack: data.attack,
			owner: playerId,
		});
	} else {
		var flying = new Flying({
			x: data.worldX,
			y: data.worldY,
			id: uniqueId,
			name: data.fireName,
			attack: data.attack,
			owner: data.owner,
		});
	}
	flyingList.push(flying);
	io.emit('new_flying', flying.Info());
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
	//console.log(data.rotation);
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
