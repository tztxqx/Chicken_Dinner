function player_coll (body, shapeA, shapeB, equation) {
	if (!body || !gameProperties.in_game)
		return;
	var gameObject = body.controller;
	var bodyId = gameObject.id;
	//the type of the body the player made contact with 
	var type = gameObject.type;
	console.log("collision", type);
	//console.log("collision player", bodyId, type);

	if (type === "player") {
	} else if (type === "pickup") {
		playerDude.readyToPick = gameObject;		
		gameObject.hintText.visible = true;
	} else if (type === "flying") {
		if (gameObject.affect(playerDude)) {
			socket.emit("player_hit", {id: bodyId});
		}
	}
}

function player_leave (body, shapeA, shapeB, equation) {
	// console.log("leave", body);
	if (!body || !gameProperties.in_game)
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
		gameObject.hintText.visible = false;
	} else if (type === 'flying') {
	}
}