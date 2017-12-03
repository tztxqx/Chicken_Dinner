// for the game element in
var pickupObjectGame = game;

//the pickup list
var pickupObjectList = [];
var pickupObjectSize = 10;


//cdplayer_image show
var pickupObjectImage = 'element';


//for pickup info will be {x,y,id,healthupAmount}
class PickupObject extends Phaser.Sprite{
	constructor(info){
		super(pickupObjectGame, info.x, info.y,
			pickupObjectImage);
		
		//add to game
		pickupObjectGame.add.existing(this);

		// unique id for the food.
		//generated in the server with node-uuid
		this.id = info.id;
		this.type = "element";
		this.healthup = info.healthupAmount

		//physics enable
		pickupObjectGame.physics.p2.enableBody(this);
		this.body.setCircle(pickupObjectSize);
		this.body.controller = this;
		// can not be push away
		this.body.data.shapes[0].sensor = true;

	}
}


// search through food list to find the food object
function finditembyid(id) {
	
	for (var i = 0; i < pickupObjectList.length; i++) {

		if (pickupObjectList[i].id == id) {
			return pickupObjectList[i]; 
		}
	}
	
	return false; 
}

// function called when new food is added in the server.
function onItemUpdate (data) {
	//console.log("get item", data.x, data.y);
	pickupObjectList.push(new PickupObject(data)); 
}

// function called when food needs to be removed in the client. 
function onItemRemove (data) {
	
	var removeItem; 
	removeItem = finditembyid(data.id);
	pickupObjectList.splice(pickupObjectList.indexOf(removeItem), 1); 
	
	//destroy the phaser object 
	removeItem.destroy(true,false);	
}