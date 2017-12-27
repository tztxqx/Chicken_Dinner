/*
@file CdPlayer Class
*/

// player's character
var playerDude;

//the enemy player list
var enemies = [];

// for the cdplayerGame cdplayer in
var cdplayerGame = game;

//show related area  (will be changed to Dictionary)*************

//cdplayer_image show
var cdplayer_image = 'dudesheet';

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
var maxVitality = 100;
var vitalityRecover = 0.05;
var maxSkills = 3;

var waterRecover = 30;
var fireAttack = 1;
var thunderUp = 5;
var windBoost = 0.3;
var earthImprove = 10;

var circleCountMax = 1000;
var circleDamage = 30;

// **************


//for CdPlayer info will be {x, y, id, name}
class CdPlayer extends Phaser.Sprite{
	constructor(info) {
		super(cdplayerGame, info.x, info.y);  // info.image || for default
		
		//add to cdplayerGame
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
		//console.log(this.children);
		//console.log(this.rotationBody.anchor);
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

		this.rotationBody.animations.add('move',[0,1,2], 10, true);
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
			this.maxHealth += deltaMax;
		this.health += delta;
		if (this.health > this.maxHealth) {
			this.health = this.maxHealth;
		}
		if (this.health < 0) {
			this.health = 0;
		}
		this.setHealthBar();
	}

	setBuff(data) {
		if (data.visible !== undefined){
			if (data.visible === false) {
				this.visible = false;
			} else {
				this.visible = true;
			}
		}
	}

	//also destroy health bar and name_show
	destroy(){
		this.health_bar.kill();
		this.player_name_show.destroy();
		var index = enemies.indexOf(this);
		if (index != -1) {
			enemies.splice(enemies.indexOf(this), 1);
		}
		super.destroy();
	}
}

class PlayerDude extends CdPlayer {
	constructor(info) {
		super(info);

		//add to cdplayerGame
		cdplayerGame.add.existing(this);
		playerLayer.add(this);

		// socket id
		this.attack = playerAttack;
		this.vitality = maxVitality;
		this.maxVitality = maxVitality;
		this.weapon = 0;
		this.boost = 1.0;

		//properties
		this.skillList = [];
		this.skillShow = [];
		this.skillbound;
		this.pickupList = [];
		this.pickupShow = [];
		this.circleCount = 0;
		this.body.collideWorldBounds = true;
		this.fireTimeList = Array(flyingInfo.length).fill(0);
		this.readyToPick = [];

		this.body.onBeginContact.add(player_coll);
		this.body.onEndContact.add(player_leave);
		cdplayerGame.camera.follow(this, Phaser.Camera.FOLLOW_LOCKON, 0.5, 0.5);

		this.gameInfo = cdplayerGame.add.text(30, 30, "waiting", {font: "15px Arial"});
		this.gameInfo.fixedToCamera = true;
		displayLayer.add(this.gameInfo);
		this.playerInfo = cdplayerGame.add.text(30, 900, "", {font: "15px Arial"});
		this.setDisplayText();
		this.playerInfo.fixedToCamera = true;
		displayLayer.add(this.playerInfo);
		
		// skillbound.cameraOffset.setTo(1524, 624);
		// skillbound.cameraOffset.setTo(1374, 624);
		// skillbound.cameraOffset.setTo(1224, 624);
	}

	setDisplayText() {
		this.playerInfo.setText(
			`attack: ${this.attack}  ` +
			`hp: ${this.health.toFixed()}\/${this.maxHealth.toFixed()}  ` +
			`mp: ${this.vitality.toFixed()}\/${this.maxVitality.toFixed()}`
		);
	}

	setHealthBar() {
		super.setHealthBar();
		this.setDisplayText();
	}

	addSkill(type) {
		if (this.skillList.length >= maxSkills)
			return;
		if (this.skillList.indexOf(type) === -1) {
			this.skillList.push(type);
			if (this.skillShow.length === 0) {
				this.skillbound = cdplayerGame.add.image(26, 774, 'skillbound');
				this.skillbound.fixedToCamera = true;
				displayLayer.add(this.skillbound);
			}
			let skillImage = cdplayerGame.add.image(150 * this.skillShow.length, 750,
				flyingInfo[type].image);
			skillImage.fixedToCamera = true;
			this.skillShow.push(skillImage);
			displayLayer.add(skillImage);
		}
	}

	useSkill(type) {
		if (type === 4) {
			socket.emit("player_buff", {"visible": false});
			let that = this;
			setTimeout(function(){
				socket.emit("player_buff", {"visible": true});
			}, flyingInfo[type].lifespan);
		}
	}

	upgrade() {
		var result = this.pickupList.map(x => Number(x.name)).sort();
		var that = this;
		if (result[0] === result[1] && result[1] === result[2]) {
			if (result[0] === 0) {
				this.addSkill(3);
			} else if (result[0] === 1) {
				this.addSkill(0);
			} else if (result[0] === 2) {
				this.addSkill(1);
			} else if (result[0] === 3) {
				this.addSkill(2);
			} else if (result[0] === 4) {
				this.addSkill(4);
			}
		} else
		if (result[0] === result[1] || result[1] === result[2]) {
			if (result[1] === 0) {
				socket.emit("hp_get", {delta: waterRecover, deltaMax: 0});
			} else if (result[1] === 1) {
				this.mpStatusChange(50);
			} else if (result[1] === 2) {
				this.attack += thunderUp;
			} else if (result[1] === 3) {
				this.boost += windBoost;
			} else if (result[1] === 4) {
				socket.emit("hp_get", {delta: earthImprove, deltaMax: earthImprove});
			}
		} else {
			if (result[0] === 1 && result[1] === 2 && result[2] === 3) {
				this.addSkill(5);
			}
		}
		this.setHealthBar();
		this.pickupList = [];
	}

	addPickup(gameObject) {
		this.readyToPick.push(gameObject);
		gameObject.hintText.visible = true;
	}

	removePickup(gameObject) {
		let pickup = this.readyToPick.indexOf(gameObject);
		if (pickup != -1)
			this.readyToPick.splice(pickup, 1); 
		if (this.readyToPick.length === 0)
			gameObject.hintText.visible = false;
	}

	pickUp(pickup) {
		this.pickupList.push(pickup);
		if (this.pickupList.length === 3) {
			this.pickupShow.forEach(function(element) {
				element.destroy();
			});
			this.pickupShow = [];
			this.upgrade();
		} else {
			let pickupImage = cdplayerGame.add.image(300 + 30 * this.pickupShow.length, 890,
				numToElement[pickup.name]);
			pickupImage.fixedToCamera = true;
			this.pickupShow.push(pickupImage);
			displayLayer.add(pickupImage);
		}
	}

	fire() {
		var type = this.skillList[this.weapon];
		if (cdplayerGame.time.now > this.fireTimeList[type] &&
			this.vitality >= flyingInfo[type].vitality) {
			this.mpStatusChange(-flyingInfo[type].vitality);
			this.fireTimeList[type] = cdplayerGame.time.now + flyingInfo[type].cd;
			return type;
		} else return -1;
	}

	hpStatusChange(delta, deltaMax) {
		super.hpStatusChange(delta, deltaMax);
		if (this.health == 0) {
			socket.emit("kill");
		}
	}

	changeWeapon(op) {
		if (this.skillList.length === 0) {
			return;
		}
		if (op === 1) {
			this.weapon = (this.weapon + this.skillList.length - 1) % this.skillList.length;
		} else {
			this.weapon = (this.weapon + 1) % this.skillList.length;
		}
		this.skillbound.cameraOffset.setTo(150 * this.weapon + 26, 774);
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

	mpStatusChange(delta, deltaMax) {
		if (deltaMax != undefined)
			this.maxVitality += deltaMax;
		this.vitality += delta;
		if (this.vitality > this.maxVitality) {
			this.vitality = this.maxVitality;
		}
		if (this.vitality < 0) {
			this.vitality = 0;
		}
		this.setDisplayText();
	}

	circleCountDown() {
		if (--this.circleCount <= 0) {
			this.circleCount = circleCountMax;
			return true;
		} else {
			return false;
		}
	}

	update() {
		this.mpStatusChange(vitalityRecover);
		if (globalCircle && !globalCircle.inCircle(this)) {
			if (this.circleCountDown()) {
				socket.emit("hp_get", {delta: -circleDamage, deltaMax: 0});
				console.log("wtf");
			}
		}
	}

	destroy() {
		super.destroy();
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
// enemy and remove from our cdplayerGame
function onRemovePlayer(data){
	var removePlayer = findplayerbyid(data.id);
	// Player not found
	if (!removePlayer) {
		console.log('Player not found: ', data.id);
		return;
	}

	//removePlayer.health_bar.destroy();
	removePlayer.destroy();

	if(playerDude === removePlayer){
		gameProperties.in_game = false;
		playerLayer.killAll();
		flyingLayer.killAll();
		pickupLayer.killAll();
		enemies = new Array();
		console.log(enemies);
		game.state.start('gameoverState',true, true);
	}
}


//create my own player
function createMyPlayer(data){
	//console.log(socket.id);
	playerDude = new PlayerDude(data);
	//console.log(playerDude);
	gameProperties.in_game = true;

	//camera follow
	//game.camera.follow(playerDude, Phaser.Camera.FOLLOW_LOCKON, 0.5, 0.5);
	console.log("created");
}

//all the player class


//Server told us enemy, create it in the client
function onNewPlayer(data){
	var new_enemy = new CdPlayer(data);
	// //ridiculous but it did happen.
	// for(var x of enemies){
	// 	if(x.id === new_enemy.id){
	// 		x.destroy();
	// 	}
	// }
	console.log("new enemies");
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

function onPlayerBuff(data) {
	//console.log("player_buff");
	var player = findplayerbyid(data.playerId);
	if (!player) {
		return;
	}
	player.setBuff(data);
}

function onPlayerHpChange (data) {
	var player = findplayerbyid(data.id);
	if (!player) {
		return;
	}
	//console.log(data);
	player.hpStatusChange(data.delta, data.deltaMax);
}

function onUsingSkill(data) {
	//console.log("player_skill");
	playerDude.useSkill(data.skillId);
}