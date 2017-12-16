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
		console.log(this.owner, player.id, this.affects);
		return (this.owner !== player.id) === this.affects;
	}

	hitPlayer(player) {
		player.hpStatusChange(-this.attack);
		return false;
	}
}

var flyingInfo = [{
	name: 'fireball',
	image: 'skill0',
	speed: 1200,
	size: 10,
	attack: 1,
	cd: 500,
	vitality: 10,
	lifespan: 1000,
	factory: Fireball,
}, {
	name: 'thunder',
	image: 'skill1',
	size: 30,
	attack: 0.8,
	affects: true,
	cd: 2000,
	vitality: 20,
	lifespan: 200,
	factory: Trap,
}, {
	name: 'tornado',
	image: 'skill2',
	speed: 500,
	size: 30,
	attack: 1.5,
	cd: 1000,
	vitality: 20,
	lifespan: 2000,
	factory: Fireball,
}, {
	name: 'spring',
	image: 'skill0',
	size: 30,
	attack: -1,
	affects: false,
	cd: 5000,
	vitality: 30,
	lifespan: 200,
	factory: Trap,
}, {
	name: 'hide',
	image: 'skill1',
	cd: 10000,
	vitality: 20,
	lifespan: 2000,
	factory: null,
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
	if (factory === null)
		return;
	//console.log(data);
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