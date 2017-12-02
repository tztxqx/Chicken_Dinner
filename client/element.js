//the element list
var element_pickup = [];
var element_size = 10;

// search through food list to find the food object
function finditembyid(id) {
	
	for (var i = 0; i < element_pickup.length; i++) {

		if (element_pickup[i].id == id) {
			return element_pickup[i]; 
		}
	}
	
	return false; 
}

// function called when new food is added in the server.
function onItemUpdate (data) {
	//console.log("get item", data.x, data.y);
	element_pickup.push(new elementObject(data.id, data.x, data.y)); 
}

// function called when food needs to be removed in the client. 
function onItemRemove (data) {
	
	var removeItem; 
	removeItem = finditembyid(data.id);
	element_pickup.splice(element_pickup.indexOf(removeItem), 1); 
	
	//destroy the phaser object 
	removeItem.item.destroy(true,false);
	
}

// the element class
var elementObject = function (id, startx, starty, value) {
	// unique id for the food.
	//generated in the server with node-uuid
	this.id = id;
	this.type = "element";

	//positinon of the food
	this.posx = startx;
	this.posy = starty;
	this.healthup = value;

	//create a circulr phaser object for food
	this.item = game.add.graphics(this.posx, this.posy);
	this.item.beginFill(0xFF0000);
	this.item.lineStyle(2, 0xFF0000, 1);
	this.item.drawCircle(0, 0, element_size*2);

	game.physics.p2.enableBody(this.item, true);
	this.item.body.setCircle(element_size);
	this.item.body.controller = this;
	this.item.body.data.shapes[0].sensor = true;
}