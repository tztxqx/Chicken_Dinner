function movetoPointer (player_dude, speed, pointer, rotation, maxTime) {

	var displayObject = player_dude;
	//console.log(displayObject);
	var angle = angleToPointer(displayObject, pointer);

	var d_rotation = displayObject.rotationBody.rotation - rotation;
	//console.log(d_rotation);
	var d_rotation_final;

	//caculate for rotation from -PI to PI
	if(d_rotation > Math.PI){
		d_rotation_final = d_rotation - 2 * Math. PI;
	}
	else if(d_rotation < -Math.PI){
		d_rotation_final = d_rotation + 2 * Math.PI;
	}
	else{
		d_rotation_final = d_rotation;
	}

	//because arcade require degrees!!!
	d_rotation_final_degree = d_rotation_final/Math.PI * 180;
	if (maxTime > 0)
	{
		speed = distanceToPointer(displayObject, pointer) / (maxTime / 1000);
		angular_speed = -(d_rotation_final_degree) / (maxTime/1000); 
	}

	displayObject.body.velocity.x = speed * Math.cos(angle);
	displayObject.body.velocity.y = speed * Math.sin(angle);

	//angular_speed 
	displayObject.rotationBody.body.angularVelocity = angular_speed;
	player_dude.setHealthBar();

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


