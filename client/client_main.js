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
function createPlayer(){	
	playerDude = game.add.sprite(32, 400, 'dude');
	game.physics.p2.enable(playerDude);
	gameProperties.in_game = true;
	socket.emit('new_player', {x: 32, y: 400});
	//camera follow
	//game.camera.follow(playerDude, Phaser.Camera.FOLLOW_LOCKON, 0.5, 0.5);
	console.log("created");
}


//enemy class
var remote_player = function (id, startx, starty) {
	this.x = startx;
	this.y = starty;
	//this is the unique socket id. We use it as a unique name for enemy
	this.id = id;
	
	this.player = game.add.sprite(this.x, this.y, 'dude');

	// draw a shape
	game.physics.p2.enableBody(this.player);
}


//Server told us enemy, create it in the client
function onNewPlayer(data){
	var new_enemy = new remote_player(data.id, data.x, data.y);
	enemies.push(new_enemy);
}

//Server tells us there is a new enemy movement. We find the moved enemy
//and sync the enemy movement with the server
function onEnemyMove (data) {
	console.log("moving enemy");
	
	var movePlayer = findplayerbyid (data.id); 
	
	if (!movePlayer) {
		return;
	}
	
	movePlayer.player.body.x = data.x; 
	movePlayer.player.body.y = data.y; 
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
var gameState = {
};

gameState = {
	preload: function() {
		console.log("preload");
		game.stage.disableVisibilityChange = true;
		game.scale.scaleMode = Phaser.ScaleManager.RESIZE;
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

		// socket.on("new_enemyPlayer", onNewPlayer);
		game.stage.backgroundColor = 0xE1A193;;
		console.log("client started");
		socket.on("your_player", createPlayer());
		//socket.on("connect", onsocketConnected); 
		
		//listen to new enemy connections
		socket.on("new_enemyPlayer", onNewPlayer);
		//listen to enemy movement 
		socket.on("enemy_move", onEnemyMove);
		
		// when received remove_player, remove the player passed; 
		socket.on('remove_player', onRemovePlayer);
	},
	
	update: function () {
		if (gameProperties.in_game) {
			var keyW = game.input.keyboard.addKey(Phaser.Keyboard.W);
			var keyA = game.input.keyboard.addKey(Phaser.Keyboard.A);
			var keyS = game.input.keyboard.addKey(Phaser.Keyboard.S);
			var keyD = game.input.keyboard.addKey(Phaser.Keyboard.D);
			//keyboardInput = game.input.keyboard.createCursorKeys();
			if (keyW.isDown){
		        //  Move to the left
		        playerDude.body.velocity.y = -150;
		       // player.animations.play('left');
	    	}
	    	else if (keyA.isDown){
		        //  Move to the right
		        playerDude.body.velocity.x = -150;
		        //player.animations.play('right');
	    	}
	    	else if (keyS.isDown){
		        //  Move to the right
		        playerDude.body.velocity.y = 150;
		        //player.animations.play('right');
	    	}
	    	else if (keyD.isDown){
		        //  Move to the right
		        playerDude.body.velocity.x = 150;

		        //player.animations.play('right');
	    	}
	    	else{
	    		playerDude.body.velocity.x = 0;
	    		playerDude.body.velocity.y = 0;
	    	}
	    	socket.emit('position_changed',{
	    		x:playerDude.body.x,
	    		y:playerDude.body.y,
	    	})
    	}

	}
}




var gameBootstrapper = {
    init: function(gameContainerElementId){
		game.state.add('gameState', gameState);
		game.state.start('gameState'); 
    }
};

gameBootstrapper.init("gameDiv");