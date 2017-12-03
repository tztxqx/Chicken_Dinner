function player_coll (body, shapeA, shapeB, equation) {
	console.log("collision", body);
	if (!body)
		return;
	var gameObject = body.controller;
	var bodyId = gameObject.id;
	//the type of the body the player made contact with 
	var type = gameObject.type;
	//console.log("collision player", bodyId, type);

	if (type === "player") {
		socket.emit('player_hit', {id: bodyId, attack: playerDude.attack}); 
	} else if (type === "pickup") {
		playerDude.readyToPick = gameObject;
	}
}

function player_leave (body, shapeA, shapeB, equation) {
	console.log("collision", body);
	if (!body)
		return;
	var gameObject = body.controller;
	var bodyId = gameObject.id;
	//the type of the body the player made contact with 
	var type = gameObject.type;
	//console.log("collision player", bodyId, type);

	if (type === "player") {
	} else if (type === "pickup") {
		if (playerDude.readyToPick === gameObject)
			playerDude.readyToPick = null;
	}
}