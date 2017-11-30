var signinState = function(game){
};

signinState.prototype = {
	preload:function(){
		game.load.spritesheet('button', '/client/image/platform.png');
	},

	create: function(){
		game.stage.backgroundColor = 0x11A193;
		button = game.add.button(game.world.centerX - 95, 400, 
			'button', this.actionOnClick, this, 2, 1, 0);

	},

	actionOnClick: function(){
		this.game.state.start("gameState");
	},
	update: function(){

	}
};

