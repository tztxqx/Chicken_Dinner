var canvas_width = window.innerWidth * window.devicePixelRatio;
var canvas_height = window.innerHeight * window.devicePixelRatio;

//the whole game
var game = new Phaser.Game(canvas_width,canvas_height, Phaser.CANVAS, 'gameDiv');

var gameBootstrapper = {
	init: function(gameContainerElementId){
		game.state.add('signinState', signinState);
		game.state.add('gameState', gameState);
		game.state.start('signinState');
	}
};


gameBootstrapper.init("gameDiv");