function movetoPointer (player_dude, speed, pointer, maxTime) {

	var displayObject = player_dude.player;
	var angle = angleToPointer(displayObject, pointer);

	if (maxTime > 0)
	{
		speed = distanceToPointer(displayObject, pointer) / (maxTime / 1000);
	}

	displayObject.body.velocity.x = Math.cos(angle) * speed;
	displayObject.body.velocity.y = Math.sin(angle) * speed;

	player_dude.health_bar.setPosition(player_dude.player.body.x,player_dude.player.body.y - health_bar_relative_height);
	player_dude.health_bar.setPercent(player_dude.life_value);


	return angle;

}

function distanceToPointer (displayObject, pointer, world) {

	if (world === undefined) { world = false; }

	var dx = (world) ? displayObject.world.x - pointer.worldX : displayObject.x - pointer.worldX;
	var dy = (world) ? displayObject.world.y - pointer.worldY : displayObject.y - pointer.worldY;

	return Math.sqrt(dx * dx + dy * dy);

}

function angleToPointer (displayObject, pointer, world) {

	if (world === undefined) { world = false; }

	if (world)
	{
		return Math.atan2(pointer.worldY - displayObject.world.y, pointer.worldX - displayObject.world.x);
	}
	else
	{
		return Math.atan2(pointer.worldY - displayObject.y, pointer.worldX - displayObject.x);
	}

}
