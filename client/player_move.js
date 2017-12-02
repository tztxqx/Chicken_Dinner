function movetoPointer (player_dude, speed, pointer, maxTime) {

	var displayObject = player_dude;
	console.log(displayObject);
	var angle = angleToPointer(displayObject, pointer);


	if (maxTime > 0)
	{
		speed = distanceToPointer(displayObject, pointer) / (maxTime / 1000);
	}

	displayObject.body.velocity.x = speed * Math.cos(angle);
	displayObject.body.velocity.y = speed * Math.sin(angle);

	player_dude.health_bar.setPosition(player_dude.body.x,player_dude.body.y - health_bar_relative_height);
	player_dude.health_bar.setPercent(player_dude.life_value);

	player_dude.player_name_show.x = player_dude.body.x;
	player_dude.player_name_show.y = player_dude.body.y - player_name_show_realtive;

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
