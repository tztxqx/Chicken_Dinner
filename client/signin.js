var signinState = function(game){
};

signinState.prototype = {
	preload:function(){
		game.load.spritesheet('button', '/client/image/startbutton.png');
	},

	create: function(){
		game.stage.backgroundColor = 0x11A193;
		button = game.add.button(game.world.centerX - 420, 300, 
			'button', this.actionOnClick, this);
		game.add.plugin(PhaserInput.Plugin);
		var input = game.add.inputField(game.world.centerX - 350, 190,{
			    font: '40px Arial',
			    fill: '#212121',
			    fontWeight: 'bold',
			    width: 290,
			    padding: 8,
			    borderWidth: 1,
			    borderColor: '#000',
			    borderRadius: 6,
			    placeHolder: 'Your Name',
			});

	},

	actionOnClick: function(){
		this.game.state.start("gameState");
	},
	update: function(){

	}
};

