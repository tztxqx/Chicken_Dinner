/*
@file CdPlayer Class
*/

// player's character
var playerDude;

//the enemy player list
var enemies = [];

// for the game cdplayer in
var cdplayerGame = game;

//show related area  (will be changed to Dictionary)*************

//cdplayer_image show
var cdplayer_image = 'dude';

//body_size
var body_size = 15;

//health bar height
var health_bar_relative_height = 20;
//player
var player_name_show_realtive = 20;
var speed_one_direction = 300;
var speed_two_direction = 0.8;

var playerAttack = 10;
var maxHealth = 100;
var waterRecover = 30;
var fireAttack = 1;
var thunderUp = 20;
var windBoost = 0.3;
var earthImprove = 10;

// **************


//for CdPlayer info will be {x, y, id, name}
class CdPlayer extends Phaser.Sprite{
	constructor(info) {
		super(cdplayerGame, info.x, info.y);  // info.image || for default
		
		//add to game
		cdplayerGame.add.existing(this);
		playerLayer.add(this);

		// socket id
		this.id = info.id;
		this.type = "player"; //currently add will be deleted in the future

		//name and name show
		this.name = info.name;
		//this.player_name_show = cdplayerGame.add.text(this.x, this.y, this.name);

		//health and health bar
		this.health = maxHealth; //same as orial life value initial_health (maxHealth default = 100 in Sprite.maxHealth)
		this.maxHealth = maxHealth;
		this.health_bar = new HealthBar(cdplayerGame, {width: 100, height: 10, 
			wdwx: this.x, y: this.y - health_bar_relative_height});

		//rotation Body for rating
		this.rotationBody = this.addChild(new Phaser.Sprite(cdplayerGame, 0, 0, cdplayer_image));
		console.log(this.children);
		console.log(this.rotationBody.anchor);
		//set to the center of the rotation
		this.rotationBody.anchor.x = 0.5;
		this.rotationBody.anchor.y = 0.5;
		//enable physics for angular velocity
		cdplayerGame.physics.arcade.enable(this.rotationBody);
		this.bodyRotation = this.rotationBody.rotation;
		
		//player_name_show add child
		this.player_name_show = this.addChild(cdplayerGame.add.text(0, -50, this.name));
		this.health_bar.setPercent(100);

		//physics enable
		cdplayerGame.physics.p2.enableBody(this);
		this.body.setCircle(body_size);
		//fixed the body rotation
		this.body.fixedRotation = true;
		this.body.controller = this;
	}
	
	//only used for set rotation
	setRotation(angle) {
		this.rotationBody.rotation = angle;
		this.bodyRotation = angle;
	}

	setHealthBar() {
		this.health_bar.setPosition(this.body.x, this.body.y - health_bar_relative_height);
		this.health_bar.setPercent(this.health / this.maxHealth * 100);
	}

	hpStatusChange(delta, deltaMax) {
		if (deltaMax != undefined)
			maxHealth += deltaMax;
		this.health += delta;
		if (this.health > this.maxHealth) {
			this.health = this.maxHealth;
		}
		if (this.health < 0) {
			this.health = 0;
		}
		this.setHealthBar();
	}

	//also destroy health bar and name_show
	destroy(){
		this.health_bar.kill();
		this.player_name_show.destroy();
		enemies.splice(enemies.indexOf(this), 1);
		super.destroy();
	}
}

class PlayerDude extends CdPlayer {
	constructor(info) {
		super(info);

		//add to game
		cdplayerGame.add.existing(this);
		playerLayer.add(this);

		// socket id
		this.attack = playerAttack;
		this.weapon = 0;
		this.boost = 1.0;

		//properties
		this.pickupList = [];
		this.body.collideWorldBounds = true;
		this.fireRate = 200;
		this.fireTime = 0;
		this.readyToPick = null;

		this.body.onBeginContact.add(player_coll);
		this.body.onEndContact.add(player_leave);
		cdplayerGame.camera.follow(this, Phaser.Camera.FOLLOW_LOCKON, 0.5, 0.5);
	}

	upgrade() {
		var result = this.pickupList.map(x => Number(x.name)).sort();
		var that = this;
		if (result[0] == result[1] || result[1] == result[2]) {
			if (result[1] == 0)
				socket.emit("hp_get", {delta: waterRecover, deltaMax: 0});
			else if (result[1] == 1) {
			} else if (result[1] == 2) {
				this.attack += thunderUp;
			} else if (result[1] == 3) {
				this.boost += windBoost;
			} else if (result[1] == 4) {
				socket.emit("hp_get", {delta: earthImprove, deltaMax: earthImprove});
			}
		}
		this.setHealthBar();
		this.pickupList = [];
	}

	pickUp(pickup) {
		this.pickupList.push(pickup);
		if (this.pickupList.length == 3) {
			this.upgrade();
		}
	}

	fire() {
		if (cdplayerGame.time.now > this.fireTime) {
			this.fireTime = cdplayerGame.time.now + this.fireRate;
			return this.weapon;
		} else return -1;
	}

	changeWeapon() {
		this.weapon = (this.weapon + 1) % flyingInfo.length;
	}

	speedBoost(p) {
		var bst = this.boost * speed_one_direction;
		if (p.x && p.y) {
			bst *= speed_two_direction;
		}
		if (p.shift) bst *= 1.1;
		return {
			x: p.x * bst,
			y: p.y * bst,
		}
	}
}

//for finding the id of the enemy
function findplayerbyid (id) {
	for (var x of enemies) {
		if (x.id == id)
			return x;
	}
	if (playerDude && id === playerDude.id) {
		return playerDude;
	}
}

//event related to Player

// When the server notifies us of client disconnection, we find the disconnected
// enemy and remove from our game
function onRemovePlayer(data){
	var removePlayer = findplayerbyid(data.id);
	// Player not found
	if (!removePlayer) {
		console.log('Player not found: ', data.id);
		return;
	}

	//removePlayer.health_bar.destroy();
	removePlayer.destroy();
}


//create my own player
function createMyPlayer(data){
	console.log(socket.id);
	playerDude = new PlayerDude(data);
	console.log(playerDude);
	gameProperties.in_game = true;

	//camera follow
	//game.camera.follow(playerDude, Phaser.Camera.FOLLOW_LOCKON, 0.5, 0.5);
	console.log("created");
}

//all the player class



//Server told us enemy, create it in the client
function onNewPlayer(data){
	var new_enemy = new CdPlayer(data);
	enemies.push(new_enemy);
}

//Server tells us there is a new enemy state change. We find the moved enemy
//and sync the enemy movement with the server
function onEnemyStateChange (data) {
	var movePlayer = findplayerbyid (data.id);

	if (!movePlayer) {
		return;
	}
	//console.log("enemy_state_change");

	//movePlayer.player.body.x = data.x;
	//movePlayer.player.body.y = data.y;
	movetoPointer(movePlayer, 300, {worldX: data.x, worldY: data.y}, data.rotation, 50);
	//movePlayer.body.rotation = data.rotation;
}

function onPlayerHpChange (data) {
	var player = findplayerbyid(data.id);
	if (!player) {
		return;
	}
	console.log(data);
	player.hpStatusChange(data.delta, data.deltaMax);
}
