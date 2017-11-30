//socket connection
var socket;
socket = io.connect();

var canvas_width = window.innerWidth * window.devicePixelRatio;
var canvas_height = window.innerHeight * window.devicePixelRatio;

//the whole game
var game = new Phaser.Game(canvas_width,canvas_height, Phaser.CANVAS, 'gameDiv');

var gameProperties = {
	gameWidth: 4000,
	gameHeight: 4000,
	game_elemnt: "gameDiv",
	in_game: false,
};

//the enemy player list
var enemies = [];

//variables
var keyboardInput;
// player's character
var playerDude;

//for finding the id of the enemy
function findplayerbyid (id) {
	for (var i = 0; i < enemies.length; i++) {
		if (enemies[i].id == id) {
			return enemies[i];
		}
	}
}

//hard to trigger
// function onsocketConnected () {
// 	console.log("connected to server");
// 	createPlayer();
// 	gameProperties.in_game = true;
// 	// send the server our initial position and tell it we are connected
// 	socket.emit('new_player', {x: 32, y: 400});
// }

// When the server notifies us of client disconnection, we find the disconnected
// enemy and remove from our game
function onRemovePlayer(data){
	var removePlayer = findplayerbyid(data.id);
	// Player not found
	if (!removePlayer) {
		console.log('Player not found: ', data.id)
		return;
	}

	removePlayer.player.destroy();
	enemies.splice(enemies.indexOf(removePlayer), 1);
}


//create my own player
function createMyPlayer(data){
	console.log(socket.id);
	playerDude = new cd_player(data.x, data.y, data.id);
	game.camera.follow(playerDude.player, Phaser.Camera.FOLLOW_LOCKON, 0.5, 0.5);
	console.log(playerDude);
	gameProperties.in_game = true;

	//camera follow
	//game.camera.follow(playerDude, Phaser.Camera.FOLLOW_LOCKON, 0.5, 0.5);
	console.log("created");
}


//all the player class
var cd_player = function (startx, starty, id) {
	this.x = startx;
	this.y = starty;
	//this is the unique socket id. We use it as a unique name for enemy
	this.id = id;

	//Setup for the health bar;
	this.health_bar = new HealthBar(game, {x: 150, y: 115});

	this.player = game.add.sprite(this.x, this.y, 'dude');
	// draw a shape
	game.physics.p2.enableBody(this.player);
}


//Server told us enemy, create it in the client
function onNewPlayer(data){
	var new_enemy = new cd_player(data.x, data.y,data.id);
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
	movetoPointer(movePlayer.player, 1500, {worldX: data.x, worldY: data.y}, 50);
	movePlayer.player.body.rotation = data.rotation;
}

//we're receiving the calculated position from the server and changing the player position
function onInputRecieved (data) {
	//we're forming a new pointer with the new position
	var newPointer = {
		x: data.x,
		y: data.y,
		worldX: data.x,
		worldY: data.y,
	}

}

//main state
var gameState = function(game) {
	this.keyW;
	this.keyS;
	this.keyA;
	this.keyD;
};

gameState.prototype = {
	preload: function() {
		console.log("preload");
		game.stage.disableVisibilityChange = true;
		game.world.setBounds(0, 0, gameProperties.gameWidth, gameProperties.gameHeight, false, false, false, false);
		game.physics.startSystem(Phaser.Physics.P2JS);
		game.physics.p2.setBoundsToWorld(false, false, false, false, false)
		game.physics.p2.gravity.y = 0;
		game.physics.p2.applyGravity = false;
		game.physics.p2.enableBody(game.physics.p2.walls, false);
		game.load.image('ground', '/client/image/platform.png');
		game.load.spritesheet('dude', '/client/image/dude.png', 32, 48);

    },

	create: function () {
		game.stage.backgroundColor = 0xE1A193;
		mapWalls = game.add.group();
		mapWalls.enableBody = true;
		var ground = mapWalls.create(0, 0, 'ground');
		ground.scale.setTo(3, 5);
		console.log("client started");

		//ask for my player
		socket.emit("my_player");
		// socket.on("connect", onsocketConnected);

		game.stage.backgroundColor = 0xE1A193;;
		console.log("client started");
		socket.on("create_player", createMyPlayer);
		//socket.on("connect", onsocketConnected);
		//listen to new enemy connections
		socket.on("new_enemyPlayer", onNewPlayer);
		//listen to enemy movement
		socket.on("enemy_state_change", onEnemyStateChange);
		// when received remove_player, remove the player passed;
		socket.on('remove_player', onRemovePlayer);
		this.keyW = game.input.keyboard.addKey(Phaser.Keyboard.W);
		this.keyA = game.input.keyboard.addKey(Phaser.Keyboard.A);
		this.keyS = game.input.keyboard.addKey(Phaser.Keyboard.S);
		this.keyD = game.input.keyboard.addKey(Phaser.Keyboard.D);


	},

	processKey: function() {
		var key = {x: 0, y: 0};
		if (this.keyW.isDown) {
			key.y = -1;
		} else if (this.keyS.isDown) {
			key.y = 1;
		}
		if (this.keyA.isDown) {
			key.x = -1;
		} else if (this.keyD.isDown) {
			key.x = 1;
		}
		return key;
	},

	update: function () {
		if (gameProperties.in_game) {

			//keyboardInput = game.input.keyboard.createCursorKeys();
			var key = this.processKey();
			var speed_one_direction = 1500;
			var speed_two_direction = 1200;
			if (key.x != 0 && key.y != 0) {
				key.x *= speed_two_direction;
				key.y *= speed_two_direction;
			} else {
				key.x *= speed_one_direction;
				key.y *= speed_one_direction;
			}
			playerDude.player.body.velocity.x = key.x;
			playerDude.player.body.velocity.y = key.y;

			//console.log(playerDude.player.x, playerDude.player.y, playerDude.player.world.x, playerDude.player.world.y);

			var pointer = game.input.mousePointer;
			playerDude.player.body.rotation = angleToPointer(playerDude.player, pointer);
			//console.log("emitting");
			socket.emit('input_control', {
				x: playerDude.player.body.x,
				y: playerDude.player.body.y,
				rotation : playerDude.player.body.rotation,
			});

			playerDude.health_bar.setPercent(20);
		}

	}
}

//return the angle relate to the mouse

var gameBootstrapper = {
	init: function(gameContainerElementId){
		game.state.add('gameState', gameState);
		game.state.start('gameState');
	}
};

gameBootstrapper.init("gameDiv");
