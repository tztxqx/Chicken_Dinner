//socket connection
var socket;
socket = io.connect();

var speed_one_direction = 300;
var speed_two_direction = 240;

var gameProperties = {
	gameWidth: 4000,
	gameHeight: 4000,
	game_elemnt: "gameDiv",
	in_game: false,
};



//variables
var keyboardInput;


//hard to trigger
// function onsocketConnected () {
// 	console.log("connected to server");
// 	createPlayer();
// 	gameProperties.in_game = true;
// 	// send the server our initial position and tell it we are connected
// 	socket.emit('new_player', {x: 32, y: 400});
// }
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
		game.scale.scaleMode = Phaser.ScaleManager.RESIZE;
		game.world.setBounds(0, 0, gameProperties.gameWidth, gameProperties.gameHeight);
		game.physics.startSystem(Phaser.Physics.P2JS);
		//game.physics.p2.setBoundsToWorld(true, true, true, true, true);
		game.physics.p2.gravity.y = 0;
		game.physics.p2.applyGravity = false;
		//game.physics.p2.enableBody(game.physics.p2.walls);
		game.load.image('ground', '/client/image/platform.png');
		game.load.spritesheet('dude', '/client/image/dude.png', 32, 48);
		game.load.spritesheet('element','/client/image/bluecircle.png');

    },

	create: function () {
		game.stage.backgroundColor = 0xE1A193;
		mapWalls = game.add.group();
		mapWalls.enableBody = true;
		var ground = mapWalls.create(0, 0, 'ground');
		ground.scale.setTo(3, 5);
		console.log("client started");

		//ask for my player
		socket.emit("my_player", {name: playerName});
		// socket.on("connect", onsocketConnected);
		socket.on("create_player", createMyPlayer);
		//socket.on("connect", onsocketConnected);
		//listen to new enemy connections
		socket.on("new_enemy", onNewPlayer);
		//listen to enemy movement
		socket.on("enemy_state_change", onEnemyStateChange);
		// when received remove_player, remove the player passed;
		socket.on('remove_player', onRemovePlayer);
		socket.on('remove_pickup', onItemRemove);
		// get hurt
		socket.on("player_hp_change", onPlayerHurt);
		// get element
		socket.on("new_pickup", onItemUpdate);
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
			if (key.x != 0 && key.y != 0) {
				key.x *= speed_two_direction;
				key.y *= speed_two_direction;
			} else {
				key.x *= speed_one_direction;
				key.y *= speed_one_direction;
			}
			playerDude.body.velocity.x = key.x;
			playerDude.body.velocity.y = key.y;

			var pointer = game.input.mousePointer;
			playerDude.body.rotation = angleToPointer(playerDude, pointer);
			//console.log("emitting");
			socket.emit('input_control', {
				x: playerDude.body.x,
				y: playerDude.body.y,
				rotation : playerDude.body.rotation,
			});

			// player name show
			playerDude.player_name_show.x = playerDude.body.x;
			playerDude.player_name_show.y = playerDude.body.y - player_name_show_realtive;

			playerDude.health_bar.setPosition(playerDude.body.x,playerDude.body.y - health_bar_relative_height);
			// Change life value can change the value in the health bar
			playerDude.health_bar.setPercent(playerDude.health);
		}

	}
}


