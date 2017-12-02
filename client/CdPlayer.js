/*
@file CdPlayer Class
*/

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

// **************

//for CdPlayer info will be {x, y, id, name}
class CdPlayer extends Phaser.Sprite{
	constructor(info) {
		super(cdplayer_game, info.x, info.y, 
		cdplayer_image);  // || for default
		
		// socket id
		this.id = info.id;
		this.type = "player"; //currently add will be deleted in the future

		//name and name show
		this.name = info.name;
		this.player_name_show = game.add.text(0, 0, this.player_name);

		//health and health bar
		this.health = 100; //same as orial life value initial_health (maxHealth default = 100 in Sprite.maxHealth)
		this.health_bar = new HealthBar(game, {width: 100, height: 10, 
		wdwx: this.x, y: this.y - health_bar_relative_height});
		this.health_bar.setPercent(this.health);
		
		//physics enable
		cdplayer_game.physics.p2.enableBody(this);
		this.body.setCircle(body_size);
		this.body.controller = this; //ask dalao

		//add game
		cdplayer_game.add.existing(this);
	}
}

//** will soon be removed
var cd_player = function (startx, starty, id, name) {
	this.x = startx;
	this.y = starty;
	//this is the unique socket id. We use it as a unique name for enemy
	this.id = id;
	this.type = "player";

	this.life_value = 100;
	//Setup for the health bar;
	this.health_bar = new HealthBar(game, {width: 100, height: 10, 
		x: this.x, y: this.y - health_bar_relative_height});
	this.health_bar.setPercent(this.life_value);

	//player name show
	this.player_name = name;
	this.player_name_show = game.add.text(0, 0, this.player_name);

	this.player = game.add.sprite(this.x, this.y, 'dude');
	// draw a shape
	game.physics.p2.enableBody(this.player);
	this.player.body.setCircle(body_size);
	this.player.body.controller = this;
}
//***