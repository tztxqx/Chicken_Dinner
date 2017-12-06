// for the game element in
var flyingObjectGame = game;

//the flying list
var flyingObjectList = [];
var flyingObjectSize = 10;
var flyingspeed = [1200];
var numToFlying = ['fireball'];
var flyingAffect = [1];

//for flying info will be {x,y,id,name,owner,rotation,attack}
class FlyingObject extends Phaser.Sprite{
	constructor(info){
		super(flyingObjectGame, info.x, info.y,
			numToFlying[info.name]);
		
		//add to game
		flyingObjectGame.add.existing(this);

		this.id = info.id;
		this.type = "flying";
		this.owner = info.owner;
		this.name = info.name;
		this.attack = info.attack;
		this.angle = info.rotation;

		//physics enable
		flyingObjectGame.physics.p2.enableBody(this);
		this.body.setCircle(flyingObjectSize);
		this.body.controller = this;
		this.body.data.shapes[0].sensor = true;
		this.body.velocity.x = Math.cos(this.angle) * flyingspeed[this.name];
		this.body.velocity.y = Math.sin(this.angle) * flyingspeed[this.name];
		// can not be push away
	}

	affect(player) {
		console.log(this.owner == player.id);
		console.log(flyingAffect[this.name], flyingAffect[this.name] & 1, flyingAffect[this.name] & 2);
		return ((flyingAffect[this.name] & 1) && this.owner !== player.id ||
			(flyingAffect[this.name] & 2) && this.owner === player.id);
	}

	hitPlayer(player) {
		player.hpChange(-this.attack);
		return true;
	}
}


// search through food list to find the food object
function findflyingbyid(id) {
	for (var x of flyingObjectList) {
		if (x.id == id) return x;
	}
	return false; 
}

function destroyFlying(flying) {
	flyingObjectList.splice(flyingObjectList.indexOf(flying), 1);
	flying.destroy(true,false);
}

// function called when new food is added in the server.
function onNewFlying (data) {
	console.log("fire!!", data.rotation);
	flyingObjectList.push(new FlyingObject(data)); 
}

// function called when food needs to be removed in the client. 
function onPlayerHit (data) {
	var player = findplayerbyid(data.playerId);
	var flying = findflyingbyid(data.flyingId);
	if (data.playerId === playerDude.id) {
		player = playerDude;
	}
	if (!player || !flying)
		return;
	if (flying.hitPlayer(player)) {
		destroyFlying(flying);
	}
}