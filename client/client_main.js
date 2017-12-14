//socket connection
var socket;
socket = io.connect();

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
	this.keyF;
	this.keyShift;
};

var countFrame = 0;
var mapWalls;
var pickupLayer;
var flyingLayer;
var playerLayer;

gameState.prototype = {
	preload: function() {
		//console.log("preload");
		game.stage.disableVisibilityChange = true;
		game.scale.scaleMode = Phaser.ScaleManager.RESIZE;
		game.world.setBounds(0, 0, gameProperties.gameWidth, gameProperties.gameHeight);
		game.physics.startSystem(Phaser.Physics.P2JS);
		//game.physics.p2.setBoundsToWorld(true, true, true, true, true);
		game.physics.p2.gravity.y = 0;
		game.physics.p2.applyGravity = false;
		//game.physics.p2.enableBody(game.physics.p2.walls);
		game.load.image('ground', '/client/image/map.jpg', 736, 736);
		game.load.spritesheet('dudesheet', '/client/image/dudesheet.png', 79, 66);
		game.load.spritesheet(numToElement[0],'/client/image/water_image.png');
		game.load.spritesheet(numToElement[1],'/client/image/fire_image.png');
		game.load.spritesheet(numToElement[2],'/client/image/thunder_image.png');
		game.load.spritesheet(numToElement[3],'/client/image/wind_image.png');
		game.load.spritesheet(numToElement[4],'/client/image/earth_image.png');
		game.load.spritesheet(flyingInfo[0].name,'/client/image/fire_image.png');
		game.load.spritesheet(flyingInfo[1].name,'/client/image/thunder_image.png');
		game.load.spritesheet(flyingInfo[2].name,'/client/image/wind_image.png');
    },

	create: function () {
		game.stage.backgroundColor = 0xE1A193;
		mapWalls = game.add.group();
		flyingLayer = game.add.group();
		pickupLayer = game.add.group();
		playerLayer = game.add.group();

		mapWalls.enableBody = true;
		var ground = mapWalls.create(0, 0, 'ground');
		ground.scale.setTo(4000/736, 4000/736);
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
		socket.on('player_pickup', onPlayerPickup);
		// get hurt
		socket.on("player_hp_change", onPlayerHpChange);
		socket.on("player_hit", onPlayerHit);
		// get element
		socket.on("new_pickup", onItemUpdate);
		socket.on("new_flying", onNewFlying);
		this.keyQ = game.input.keyboard.addKey(Phaser.Keyboard.Q);
		this.keyQ.onDown.add(function(){
			if (playerDude) {
				playerDude.changeWeapon();
			}
		}, this);
		game.input.keyboard.removeKeyCapture(Phaser.Keyboard.Q);
		this.keyW = game.input.keyboard.addKey(Phaser.Keyboard.W);
		this.keyA = game.input.keyboard.addKey(Phaser.Keyboard.A);
		this.keyS = game.input.keyboard.addKey(Phaser.Keyboard.S);
		this.keyD = game.input.keyboard.addKey(Phaser.Keyboard.D);
		this.keyF = game.input.keyboard.addKey(Phaser.Keyboard.F);
		this.keyShift = game.input.keyboard.addKey(Phaser.Keyboard.SHIFT);
		this.mouseL = game.input.activePointer.leftButton;
	},

	processKey: function() {
		var key = {x: 0, y: 0, f: 0, shift: 0, fire: -1};
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
		if (this.keyF.isDown) {
			key.f = 1;
		}
		if (this.keyShift.isDown) {
			key.shift = 1;
		}
		if (this.mouseL.isDown) {
			key.fire = playerDude.fire();
		}
		return key;
	},

	update: function () {
		countFrame ++;
		if (countFrame % 2 != 0) {
			return;
		}
		if (!playerDude || !playerDude.alive) {
			return;
		}
		if (gameProperties.in_game) {

			//keyboardInput = game.input.keyboard.createCursorKeys();
			var key = this.processKey();
			var speed = playerDude.speedBoost(key);
			playerDude.body.velocity.x = speed.x;
			playerDude.body.velocity.y = speed.y;

			if((speed.x != 0) || (speed.y !=0)){
				playerDude.rotationBody.animations.play('move');
			}
			else{
				playerDude.rotationBody.animations.stop();

				playerDude.rotationBody.frame = 1;
			}

			var pointer = game.input.mousePointer;
			playerDude.setRotation(angleToPointer(playerDude, pointer));
			//console.log(angleToPointer(playerDude, pointer));
			//console.log("emitting");
			var inputSet = {
				x: playerDude.body.x,
				y: playerDude.body.y,
				rotation : playerDude.bodyRotation,
			};
			if (key.f && playerDude.readyToPick) {
				inputSet.pickId = playerDude.readyToPick.id;
			}
			if (key.fire != -1) {
				inputSet.fire = 1;
				inputSet.fireName = key.fire;
				inputSet.attack = playerDude.attack;
				if (key.fire === 1) {
					inputSet.worldX = pointer.worldX;
					inputSet.worldY = pointer.worldY;
				}
			}

			socket.emit('input_control', inputSet);

			// player name show
			//playerDude.player_name_show.x = playerDude.body.x;
			//playerDude.player_name_show.y = playerDude.body.y - player_name_show_realtive;

			playerDude.setHealthBar();
			// Change life value can change the value in the health bar
			//playerDude.health_bar.setPercent(playerDude.health / playerDude.maxHealth * 100);
		}

	}
}


