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

const beginCountDown = 2;
var gameState = 0;

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

function inList(element, list) {
	return (list.indexOf(element) != -1) ? true : false;
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
		if (flyingInfo[this.name].factory === "Fireball") {
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
		if (flyingInfo[this.name].factory === "Fireball") {
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
	that.emit("create_player", newPlayer.Info());
	playerList.forEach(function(player) {
		that.emit("new_enemy", player.Info());
	});
	pickupList.forEach(function(pickup) {
		that.emit("new_pickup", pickup.Info());
	});
	if (gameState === 2) {
		that.emit("new_game", {countDown: 0});
	}
	//send message to every connected client except the sender
	this.broadcast.emit('new_enemy', newPlayer.Info());
	playerList.push(newPlayer);
	//console.log(playerList.length);
}

function removePlayer() {
	var currentPlayer = findPlayerId(this.id);

	if (currentPlayer) {
		playerList.splice(playerList.indexOf(currentPlayer), 1);
	}
	if (playerList.length === 0) {
		gameState = 0;
	}
	console.log("removing player " + this.id);
	//send message to every connected client except the sender
	io.emit('remove_player', {id: this.id});
}

function onPlayerBuff(data) {
	var currentPlayer = findPlayerId(this.id);
	if (!currentPlayer) {
		return;
	}
	data.playerId = this.id;
	this.broadcast.emit('player_buff', data);
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
	if (flyingInfo[data.fireName].factory === "Fireball") {
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
			owner: playerId,
		});
	}
	flyingList.push(flying);
	io.emit('new_flying', flying.Info());
}

function useSkill(socket, data) {
	var currentPlayer = findPlayerId(socket.id);
	if (!currentPlayer)
		return;
	socket.emit("player_use_skill", {skillId: data.fireName});
}

function countDown(time) {
	setTimeout(function() {
		time -= 1;
		if (time >= 0) {
			io.emit("new_game", {countDown: time});
			if (time === 0) {
				gameState = 2;
			} else {
				countDown(time);
			}
		}
	}, 1000);
}

function changeGameState(state) {
	if (state === 1) {
		if (gameState === 0) {
			gameState = 1;
			countDown(beginCountDown);
		}
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
	//console.log(data.rotation);
	//console.log("where is enemy", currentData);
	this.broadcast.emit('enemy_state_change', currentData);
	if (data.start) {
		changeGameState(data.start);
	}
	if (data.pickId) {
		pickUp(this.id, data.pickId);
	}
	if (data.fire) {
		if (Number(data.fireName) > flyingInfo.length){
		} else {
			if (flyingInfo[data.fireName].factory != "null") {
				newFire(this.id, data);
			} else {
				useSkill(this, data);
			}
		}
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
	socket.on("player_buff", onPlayerBuff);
	socket.on("player_hit", onHit);
	socket.on("hp_get", onHpGet);
	socket.on("new_game", changeGameState);
});

var flyingInfo = [{
	name: 'fireball',
	factory: "Fireball",
}, {
	name: 'skyThunder',
	factory: "Trap",
}, {
	name: 'tornado',
	factory: "Fireball",
}, {
	name: 'spring',
	factory: "Trap",
}, {
	name: 'hide',
	factory: "null",
}, {
	name: 'flow',
	factory: "Fireball",
}];