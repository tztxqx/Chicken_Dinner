var gameoverState = function(game){
};

// player's customize name
var playerName;

var inputName;
gameoverState.prototype = {
	preload:function(){
		game.world.setBounds(0, 0, 1920, 916);
		game.load.image('gameover', '/client/image/gameover.png');
	},

	create: function(){
		game.stage.backgroundColor = 0x11A193;		
		game.add.image(game.world.centerX - 220, 300,'gameover');
		//player's input field
		//console.log(inputName);
		//console.log(enemies);
	},

	actionOnClick: function(){
		playerName = inputName.value || "unknown";
		console.log(inputName.value);
		this.game.state.start("gameState", true, true);
	},
	update: function(){

	}
};

