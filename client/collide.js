function player_coll (body, bodyB, shapeA, shapeB, equation) {
	console.log("collision", body);
	if (!body)
		return;
	var gameObject = body.controller;
	var bodyId = gameObject.id;
	if (bodyId == playerDude.id) {
		return;
	}
	//the type of the body the player made contact with 
	var type = gameObject.type;
	//console.log("collision player", bodyId, type);

	if (type == "player") {
		socket.emit('player_collision', {id: bodyId, attack: gameObject.attack}); 
	} else if (type == "element") {
		socket.emit('pick_up', {id: bodyId, gain: gameObject.healthup}); 
	}
}