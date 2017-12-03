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
		super(cdplayerGame, info.x, info.y, 
		cdplayer_image);  // info.image || for default
		
		//add to game
		cdplayerGame.add.existing(this);

		// socket id
		this.id = info.id;
		this.type = "player"; //currently add will be deleted in the future
		this.attack = playerAttack;
		this.boost = 1.0;

		//properties
		this.pickupList = [];
		this.readyToPick = null;

		//name and name show
		this.name = info.name;
		this.player_name_show = cdplayerGame.add.text(this.x, this.y, this.name);

		//health and health bar
		this.health = maxHealth; //same as orial life value initial_health (maxHealth default = 100 in Sprite.maxHealth)
		this.maxHealth = maxHealth;
		this.health_bar = new HealthBar(game, {width: 100, height: 10, 
			wdwx: this.x, y: this.y - health_bar_relative_height});
		this.health_bar.setPercent(100);
		
		//physics enable
		cdplayerGame.physics.p2.enableBody(this);
		this.body.setCircle(body_size);
		this.body.controller = this;
	}

	setHealthBar() {
		this.health_bar.setPosition(this.body.x, this.body.y - health_bar_relative_height);
		this.health_bar.setPercent(this.health / this.maxHealth * 100);
	}

	upgrade() {
		var result = this.pickupList.map(x => elementToNum[x.name]).sort();
		var that = this;
		if (result[0] == result[1] || result[1] == result[2]) {
			if (result[1] == 0)
				this.hpChange(waterRecover);
			else if (result[1] == 1) {
				enemies.forEach(function(player) {
					socket.emit("player_hit", {id: player.id, attack: fireAttack * that.attack});
				});
			} else if (result[1] == 2) {
				this.attack += thunderUp;
			} else if (result[1] == 3) {
				this.boost += windBoost;
			} else if (result[1] == 4) {
				this.health += earthImprove;
				this.maxHealth += earthImprove;
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

	hpChange(delta) {
		var newHealth = this.health + delta;
		if (newHealth > maxHealth) {
			newHealth = maxHealth;
		}
		this.health = newHealth;
		this.setHealthBar();
	}

	//also destroy health bar and name_show
	realDestroy(){
		this.health_bar.kill();
		this.player_name_show.destroy();
		this.destroy();
	}
}

//for finding the id of the enemy
function findplayerbyid (id) {
	for (var i = 0; i < enemies.length; i++) {
		if (enemies[i].id == id) {
			return enemies[i];
		}
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
	removePlayer.realDestroy();
	enemies.splice(enemies.indexOf(removePlayer), 1);
}


//create my own player
function createMyPlayer(data){
	console.log(socket.id);
	playerDude = new CdPlayer(data);
	console.log(playerDude.name);
	playerDude.body.collideWorldBounds = true;
	playerDude.body.onBeginContact.add(player_coll);
	playerDude.body.onEndContact.add(player_leave);
	game.camera.follow(playerDude, Phaser.Camera.FOLLOW_LOCKON, 0.5, 0.5);
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

function onPlayerHurt (data) {
	var player = findplayerbyid(data.id);
	if (data.id == playerDude.id) {
		player = playerDude;
	}
	player.hpChange(data.delta);
}
