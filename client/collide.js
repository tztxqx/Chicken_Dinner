function player_coll (body, bodyB, shapeA, shapeB, equation) {
	console.log("collision", body);
	if (!body)
		return;
	var key = body.controller.id; 
	//the type of the body the player made contact with 
	var type = body.controller.type;
	//console.log("collision player", key, type);

	if (type == "player") {
		socket.emit('player_collision', {id: key}); 
	} else if (type == "element") {
		socket.emit('item_picked', {id: key}); 
	}
}