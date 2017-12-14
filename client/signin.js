var signinState = function(game){
};

// player's customize name
var playerName;

var inputName;
signinState.prototype = {
	preload:function(){
		console.log("reload");
		game.world.setBounds(0, 0, 1920, 916);
		game.load.spritesheet('button', '/client/image/startbutton.png');
	},

	create: function(){
		game.stage.backgroundColor = 0x11A193;
		//start button
		button = game.add.button(game.world.centerX - 420, 300, 
			'button', this.actionOnClick, this);
		//console.log("recreate");
		//player's input field
		game.add.plugin(PhaserInput.Plugin);
		inputName = game.add.inputField(game.world.centerX - 350, 190,{
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
		playerName = inputName.value || "unknown";
		console.log(inputName.value);
		this.game.state.start("gameState", true, true);
	},
	update: function(){

	}
};

