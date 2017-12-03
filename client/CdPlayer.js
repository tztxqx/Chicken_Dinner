/*
@file CdPlayer Class
*/

// player's character
var playerDude;

//the enemy player list
var enemies = [];

// for the game cdplayer in
var cdplayer_game = game;

//show related area  (will be changed to Dictionary)*************

//cdplayer_image show
var cdplayer_image = 'dude';

//body_size
var body_size = 15;

//health bar height
var health_bar_relative_height = 20;
//player
var player_name_show_realtive = 20;

var playerAttack = 10;
var maxHealth = 100;

// **************

//for CdPlayer info will be {x, y, id, name}
class CdPlayer extends Phaser.Sprite{
	constructor(info) {
		super(cdplayer_game, info.x, info.y, 
		cdplayer_image);  // info.image || for default
		
		//add to game
		cdplayer_game.add.existing(this);

		// socket id
		this.id = info.id;
		this.type = "player"; //currently add will be deleted in the future
		this.attack = playerAttack;

		//name and name show
		this.name = info.name;
		this.player_name_show = game.add.text(0, 0, this.player_name);

		//health and health bar
		this.health = maxHealth; //same as orial life value initial_health (maxHealth default = 100 in Sprite.maxHealth)
		this.health_bar = new HealthBar(game, {width: 100, height: 10, 
			wdwx: this.x, y: this.y - health_bar_relative_height});
		this.health_bar.setPercent(this.health);
		
		//physics enable
		cdplayer_game.physics.p2.enableBody(this);
		this.body.setCircle(body_size);
		this.body.controller = this; //ask dalao		
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
	removePlayer.destroy();
	enemies.splice(enemies.indexOf(removePlayer), 1);
}


//create my own player
function createMyPlayer(data){
	console.log(socket.id);
	playerDude = new CdPlayer(data);
	console.log(playerDude.name);
	playerDude.body.collideWorldBounds = true;
	playerDude.body.onBeginContact.add(player_coll);
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
	console.log("hurt");
	var player = findplayerbyid (data.id);
	if (data.id == playerDude.id) {
		player = playerDude;
	}
	var newHealth = player.health + data.delta;
	if (newHealth > maxHealth) {
		newHealth = maxHealth;
	}
	player.health = newHealth;
}
