// for the game element in
var flyingObjectGame = game;

//the flying list
var flyingObjectList = [];
var spriteSize = 10;

//for flying info will be {x,y,id,name,owner,attack}
class FlyingObject extends Phaser.Sprite{
	constructor(info){
		var flyingConst = flyingInfo[info.name];
		super(flyingObjectGame, info.x, info.y,
			flyingConst.name);
		
		//add to game
		flyingObjectGame.add.existing(this);
		flyingLayer.add(this);

		this.id = info.id;
		this.type = "flying";
		this.owner = info.owner;
		this.name = info.name;
		this.attack = info.attack * flyingConst.attack;
		this.lifespan = flyingConst.lifespan;

		//physics enable
		this.scale.set(flyingConst.size / spriteSize);
		flyingObjectGame.physics.p2.enableBody(this);
		this.body.setCircle(flyingConst.size);
		this.body.controller = this;
		this.body.data.shapes[0].sensor = true;
		// can not be push away
	}

	affect(player) {
	}

	hitPlayer(player) {
	}

	kill() {
		flyingObjectList.splice(flyingObjectList.indexOf(this), 1);
		super.destroy();
	}

	destroy() {
		flyingObjectList.splice(flyingObjectList.indexOf(this), 1);
		super.destroy();
	}
}

// for fireball info will be {x,y,id,name,owner,rotation,attack}
class Fireball extends FlyingObject {
	constructor(info) {
		var flyingConst = flyingInfo[info.name];
		super(info);
		this.body.velocity.x = Math.cos(info.rotation) * flyingConst.speed;
		this.body.velocity.y = Math.sin(info.rotation) * flyingConst.speed;
	}

	affect(player) {
		return this.owner !== player.id;
	}

	hitPlayer(player) {
		player.hpStatusChange(-this.attack);
		return true;
	}
}

// for trap info will be {x,y,id,name,owner,attack}
class Trap extends FlyingObject {
	constructor(info) {
		var flyingConst = flyingInfo[info.name];
		super(info);
		this.affects = flyingConst.affects;
	}

	affect(player) {
		return (this.owner !== player.id) === this.affects;
	}

	hitPlayer(player) {
		player.hpStatusChange(-this.attack);
		return false;
	}
}

var flyingInfo = [{
	name: 'fireball',
	speed: 1200,
	size: 10,
	attack: 1,
	cd: 500,
	lifespan: 1000,
	factory: Fireball,
}, {
	name: 'thunder',
	size: 30,
	attack: 0.8,
	affects: true,
	cd: 2000,
	lifespan: 200,
	factory: Trap,
}];

// search through food list to find the food object
function findflyingbyid(id) {
	for (var x of flyingObjectList) {
		if (x.id === id) return x;
	}
	return false; 
}

// function called when new food is added in the server.
function onNewFlying (data) {
	var factory = flyingInfo[data.name].factory;
	console.log(data);
	flyingObjectList.push(new factory(data));
}

// function called when food needs to be removed in the client.
function onPlayerHit (data) {
	var player = findplayerbyid(data.playerId);
	var flying = findflyingbyid(data.flyingId);
	if (!player || !flying)
		return;
	//console.log(player, flying);
	if (flying.hitPlayer(player)) {
		flying.kill();
	}
}