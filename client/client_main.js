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
	this.countFrame = {};
	this.setFrame("input", 2);
	this.setFrame("player", 1);
	this.setFrame("circle", 10);
};

var mapWalls;
var pickupLayer;
var flyingLayer;
var playerLayer;
var displayLayer;
var playerGameState = 0;

gameState.prototype = {
	loadImage: function() {
		game.load.image('ground', '/client/image/map.jpg');
		game.load.image(flyingInfo[0].image, '/client/image/skill0.png');
		game.load.image(flyingInfo[1].image, '/client/image/skill1.png');
		game.load.image(flyingInfo[2].image, '/client/image/skill2.png');
		game.load.image('skillbound', '/client/image/skillbound.png');
		game.load.spritesheet('dudesheet', '/client/image/dudesheet.png', 79, 66);
		game.load.image(numToElement[0],'/client/image/water_image.png');
		game.load.image(numToElement[1],'/client/image/fire_image.png');
		game.load.image(numToElement[2],'/client/image/thunder_image.png');
		game.load.image(numToElement[3],'/client/image/wind_image.png');
		game.load.image(numToElement[4],'/client/image/earth_image.png');
		game.load.image(flyingInfo[0].name,'/client/image/fire_image.png');
		game.load.image(flyingInfo[1].name,'/client/image/thunder_range.png');
		game.load.image(flyingInfo[2].name,'/client/image/wind_image.png');
		game.load.image(flyingInfo[3].name,'/client/image/water_image.png');
		game.load.image(flyingInfo[5].name,'/client/image/wind_image.png');
		game.load.image("circle",'/client/image/water_image.png');
	},

	preload: function() {
		//console.log("preload");
		game.stage.disableVisibilityChange = true;
		game.scale.scaleMode = Phaser.ScaleManager.RESIZE;
		game.world.setBounds(0, 0, gameProperties.gameWidth, gameProperties.gameHeight);
		game.physics.startSystem(Phaser.Physics.P2JS);
		//game.physics.p2.setBoundsToWorld(true, true, true, true, true);
		game.physics.p2.gravity.y = 0;
		game.physics.p2.applyGravity = false;
		this.loadImage();
		//game.physics.p2.enableBody(game.physics.p2.walls);
    },

    bindKeys: function() {
    	this.keyQ = game.input.keyboard.addKey(Phaser.Keyboard.Q);
		this.keyQ.onDown.add(function(){
			if (gameProperties.in_game) {
				playerDude.changeWeapon(1);
			}
		}, this);
		game.input.keyboard.removeKeyCapture(Phaser.Keyboard.Q);
		this.keyE = game.input.keyboard.addKey(Phaser.Keyboard.E);
		this.keyE.onDown.add(function(){
			if (gameProperties.in_game) {
				playerDude.changeWeapon();
			}
		}, this);
		game.input.keyboard.removeKeyCapture(Phaser.Keyboard.E);
		this.keyW = game.input.keyboard.addKey(Phaser.Keyboard.W);
		this.keyA = game.input.keyboard.addKey(Phaser.Keyboard.A);
		this.keyS = game.input.keyboard.addKey(Phaser.Keyboard.S);
		this.keyD = game.input.keyboard.addKey(Phaser.Keyboard.D);
		this.keyF = game.input.keyboard.addKey(Phaser.Keyboard.F);
		this.keyShift = game.input.keyboard.addKey(Phaser.Keyboard.SHIFT);
		this.keyEnter = game.input.keyboard.addKey(Phaser.Keyboard.ENTER);
		this.keyEnter.onDown.add(function(){
			if (gameProperties.in_game) {
				socket.emit("new_game", 1);
			}
		}, this);
		game.input.keyboard.removeKeyCapture(Phaser.Keyboard.ENTER);
		this.mouseL = game.input.activePointer.leftButton;
    },

    listenSocket: function() {
    	socket.on("create_player", createMyPlayer);
		//socket.on("connect", onsocketConnected);
		//listen to new enemy connections
		socket.on("new_enemy", onNewPlayer);
		//listen to enemy movement
		socket.on("enemy_state_change", onEnemyStateChange);
		// when received remove_player, remove the player passed;
		socket.on('remove_player', onRemovePlayer);
		socket.on('player_pickup', onPlayerPickup);
		// player event
		socket.on("player_hp_change", onPlayerHpChange);
		socket.on("player_buff", onPlayerBuff);
		socket.on("player_hit", onPlayerHit);
		// get element
		socket.on("new_pickup", onItemUpdate);
		socket.on("new_flying", onNewFlying);
		socket.on("player_use_skill", onUsingSkill);
		socket.on("new_game", onNewGame);
    },

	create: function () {
		game.stage.backgroundColor = 0xE1A193;
		mapWalls = game.add.group();
		flyingLayer = game.add.group();
		pickupLayer = game.add.group();
		playerLayer = game.add.group();
		displayLayer = game.add.group();

		mapWalls.enableBody = true;
		var ground = mapWalls.create(0, 0, 'ground');
		ground.scale.setTo(4000/736, 4000/736);
		console.log("client started");
		//ask for my player
		this.listenSocket();
		socket.emit("my_player", {name: playerName});
		// socket.on("connect", onsocketConnected);
		this.bindKeys();
	},

	processKey: function() {
		var key = {x: 0, y: 0, f: 0, shift: 0, fire: -1, start: 0};
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
		if (this.keyEnter.isDown) {
			key.start = 1;
		}
		return key;
	},

	setFrame: function(key, y) {
		this.countFrame[key] = {
			x: 0,
			y: y
		};
	},

	updateFrame: function(key) {
		this.countFrame[key].x ++;
		if (this.countFrame[key].x % this.countFrame[key].y != 0) {
			return false;
		}
		return true;
	},

	sendInput: function() {
		if (!this.updateFrame("input"))
			return;
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

			if (playerGameState === 2) {
				if (key.f && playerDude.readyToPick.length > 0) {
					inputSet.pickId = playerDude.readyToPick[0].id;
				}
				if (key.fire != -1) {
					inputSet.fire = 1;
					inputSet.fireName = key.fire;
					inputSet.attack = playerDude.attack;
					if (flyingInfo[key.fire].attackMode === "mouse") {
						inputSet.worldX = pointer.worldX;
						inputSet.worldY = pointer.worldY;
					}
					if (flyingInfo[key.fire].attackMode === "player") {
						inputSet.worldX = inputSet.x;
						inputSet.worldY = inputSet.y;
					}
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
	},

	playerUpdate: function() {
		if (this.updateFrame("player")) {
			playerDude.update();
		}
		if (this.updateFrame("circle")) {
			if (globalCircle) {
				globalCircle.update();
			}
		}
	},

	update: function () {
		if (!gameProperties.in_game) {
			return;
		}
		this.sendInput();
		this.playerUpdate();
	}
}

function onNewGame(data) {
	if (!gameProperties.in_game) {
		return;
	}
	if (data.countDown === 0) {
		playerGameState = 2;
		newCircle();
		playerDude.gameInfo.setText("Begin!");
	} else {
		playerGameState = 1;
		playerDude.gameInfo.setText("Counting: " + String(data.countDown));
	}
}