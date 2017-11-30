function movetoPointer (displayObject, speed, pointer, maxTime) {

	var angle = angleToPointer(displayObject, pointer);
	console.log(displayObject.x, displayObject.y);
	console.log(displayObject);

	if (maxTime > 0)
	{
		speed = distanceToPointer(displayObject, pointer) / (maxTime / 1000);
	}
	console.log(distanceToPointer(displayObject, pointer));
	
	displayObject.body.velocity.x = Math.cos(angle) * speed;
	displayObject.body.velocity.y = Math.sin(angle) * speed;

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