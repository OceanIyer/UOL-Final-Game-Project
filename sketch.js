/*

Main Game Project

*/

//Declaring Variables
let gameChar_screen_x;
let gameChar_screen_y;
let gameChar_world_x
let gameChar_world_y

let cameraPos_x
let cameraPos_y
const damp = 0.9;

const floorPos_y = 576 * 3/4;

let isLeft;
let isRight;
let isFalling;
let isPlummeting;

let collectables;
let canyons;
let clouds
let mountains
let trees

let game_score;
let flagpole;
let lives;

let jumpSound;
let collectableSound;
let deathSound;
let checkpointSound
let backgroundSound

const platforms = []
let enemies

let emit

function preload()
{
    soundFormats('mp3','wav', 'm4a');
    
    //loading sounds
    deathSound = loadSound('assets/death.mp3')
    deathSound.setVolume(0.2)

    collectableSound = loadSound('assets/collectcoin.mp3')
    collectableSound.setVolume(0.2)

    jumpSound = loadSound('assets/jump.wav');
    jumpSound.setVolume(0.1);

	checkpointSound = loadSound('assets/checkpoint.m4a')
	checkpointSound.setVolume(0.1)

	backgroundSound = loadSound('assets/background.mp3')
	backgroundSound.setVolume(0.07)
}


function setup()
{
	createCanvas(1024, 576)
	//Loops music in background
	backgroundSound.loop()

	//Creates new emitter
	emit = new Emitter(2500, floorPos_y - 1000, 0, 1, 10, color(255))
	//Emits particles
	emit.startEmitter(10000, 25000)

	lives = 3

	//Game reset if character dies
	startGame()
	pushPlatforms()
}

function draw()
{

	background(48, 201, 229) //draws sky

	// Sets camera's position relative to the world
	// Creates damping to camera position when moving char
	const targetPos_x =  gameChar_world_x - gameChar_screen_x;
  	const targetPos_y =  gameChar_world_y - gameChar_screen_y;
	cameraPos_x = cameraPos_x * damp + targetPos_x * (1 - damp)
	cameraPos_y = cameraPos_y * damp + targetPos_y * (1 - damp)

	push()
	
	///Moves world in relation to camera
	translate(cameraPos_x, -cameraPos_y)

	//Drawing the ground
	noStroke()
	fill(72, 190, 52)
	rect(-5000, floorPos_y, width * 50, height - floorPos_y + 5000) //draw some green ground

	//For loop for drawing the mountains
	drawMountains()

	// For loop for drawing the clouds
	drawClouds()

	// For loop for drawing the trees
	drawTrees()

	//draw platforms and updating position of moving ones
	for(const p of platforms){
		p.update()
		p.drawPlatform()
	}

	//Checking if the character is on the collectable so isFound can be set to true
	// and drawing the collectable
	for(const co of collectables)
	{
		if(!co.isFound){
			drawCollectable(co)
			checkCollectable(co)
		}
	}

	//Checking if the game character is falling on the canyon and drawing canyon
	for(const ca of canyons)
	{
        if(!ca.isPlummeting){
            checkCanyon(ca)
		    drawCanyon(ca)
        }
	}

	//Drawing the game character
	drawGameCharacter()

	//Draw in flagpole
	renderFlagpole()
	
	//check if flagpole is reached
	if(flagpole.isReached == false){
		checkFlagpole()
	}

	//Draws enemies and checks if character is in contact with them
	checkEnemies()

	//checks if player is alive or not
	checkPlayerDie()
	emit.updateParticles()
	pop()

	// Writing score to the screen
	fill(0)
	noStroke()
	textSize(22)
	text("Score: " + game_score, 25, 70)

	//Drawing lives to the screen
	for (let i = 0; i < lives; i++){
		fill(255, 0 , 0)
        rect(30 + 30*i, 20, 7, 25, 100)
		rect(21 + 30*i, 29, 25, 7, 100)
	}

	// Game ending screen
	if (lives < 1){
		fill(255)
		textSize(20)
		text("Game over. Press space to try again", width/2 - 150, height/2)
		return;
	}

	//Level Complete Screen
	if(flagpole.isReached){
		fill(255)
		textSize(20)
		text("Level Complete. Press space to try again", width/2 - 150, height/2)
		text("Your score: " + game_score, width/2 - 10, height/2 + 30)
		return;
	}
	
	///////////INTERACTION CODE AND LOGIC//////////
	//Put conditional statements to move the game character below here

	//Moves character to the left
	if (isLeft){
		gameChar_screen_x -= 5
	} 

	//Moves character to the right
	if (isRight){
		gameChar_screen_x += 5
	} 

	isFalling = false

	//Logic for gravity so the character falls back down
	//Logic for the character to stand on platform
	if (gameChar_world_y < floorPos_y)
	{
		let isContact = false
		for(const p of platforms)
		{
			if(p.checkContact(gameChar_screen_x, gameChar_world_y))
			{
				isContact = true
				isFalling = false
				gameChar_world_y = p.y
				if(p instanceof MovingPlatform){
					gameChar_screen_x += p.direction
				}
				break
			}
		}
		if(!isContact)
		{
			isFalling = true
			gameChar_world_y += 3
		}
	} else {
		isFalling = false
	}

	// Logic to allow the background to move
	if(isLeft){
		gameChar_screen_x -= 0.5
	}

	if (isRight) {
		gameChar_screen_x += 0.5
	}

	// Allowing character to fall down the canyon
	if(isPlummeting){
		gameChar_world_y += 7
	}

	
}

// Key control functions

function keyPressed()
{
	// if statements to control the animation of the character when
	// keys are pressed.
	//Sets the variable isRight true when D key is pressed
	if (keyCode == 68 && isPlummeting == false){
		isRight = true
	}

	//Sets the variable isLeft true when A key is pressed
	if (keyCode == 65 && isPlummeting == false){
		isLeft = true
	}

	//Sets the variable isFalling true when W key is pressed
	//logic for charaacter jumping
	if ((key == "w" || key == " ") && isFalling == false 
		&& isPlummeting == false){
		isFalling = true
		gameChar_world_y -= 100
        jumpSound.play()
	}

}

function keyReleased()
{
	// if statements to control the animation of the character when
	// keys are released
	// Releasing the right key
	if (keyCode == 68){
		isRight = false
	}

	//Releasing the left key
	if (keyCode == 65){
		isLeft = false
	}
}

// Function to draw game character
function drawGameCharacter(){
	if(isLeft && isFalling)
	{
		// add your jumping-left code
		//shadows

		fill(85, 0, 181)
		beginShape()
		vertex(gameChar_screen_x + 7, gameChar_world_y - 33)
		vertex(gameChar_screen_x + 19, gameChar_world_y - 51)
		vertex(gameChar_screen_x + 24, gameChar_world_y - 51)
		endShape()

		//hands
		fill(255, 207, 156)
		ellipse(gameChar_screen_x + 20, gameChar_world_y - 45, 10, 10)
		ellipse(gameChar_screen_x - 20, gameChar_world_y - 45, 10, 10)
	
		//feet
		fill(233, 0, 241)
		beginShape()
		vertex(gameChar_screen_x + 15, gameChar_world_y - 27)
		vertex(gameChar_screen_x + 6, gameChar_world_y - 33)
		vertex(gameChar_screen_x + 2, gameChar_world_y - 28)
		endShape()
	
		//feet
		fill(233, 0, 241)
		beginShape()
		vertex(gameChar_screen_x - 6, gameChar_world_y - 27)
		vertex(gameChar_screen_x - 6, gameChar_world_y - 33)
		vertex(gameChar_screen_x - 2, gameChar_world_y - 28)
		endShape()
		
		stroke(242, 119, 63)
		line(gameChar_screen_x + 19, gameChar_world_y - 49,
			 gameChar_screen_x + 24, gameChar_world_y - 44)
		noStroke()
	
		stroke(242, 119, 63)
		line(gameChar_screen_x + 22, gameChar_world_y - 41,
			 gameChar_screen_x + 17, gameChar_world_y - 46)
		noStroke()
	
		stroke(242, 119, 63)
		line(gameChar_screen_x - 22, gameChar_world_y - 41,
			 gameChar_screen_x - 17, gameChar_world_y - 46)
		noStroke()
	
		stroke(242, 119, 63)
		line(gameChar_screen_x - 19, gameChar_world_y - 49,
			 gameChar_screen_x - 24, gameChar_world_y - 44)
		noStroke()
	
		//Purple Head and body
		fill(111,15,219);
		rect(gameChar_screen_x - 12, gameChar_world_y - 75, 25, 25)
		triangle(gameChar_screen_x - 22, gameChar_world_y - 51, gameChar_screen_x, 
			gameChar_world_y - 25, gameChar_screen_x + 22, gameChar_world_y - 51 )
		
		//Face
		fill(255,207,156)
		rect(gameChar_screen_x - 11, gameChar_world_y - 74, 20, 18)
	
		//Eyes
		fill(0)
		ellipse(gameChar_screen_x - 8, gameChar_world_y - 69, 3, 4)
		ellipse(gameChar_screen_x - 1, gameChar_world_y - 69, 3, 4)
	
		//eyebrows
		fill(121, 62, 0)
		rect(gameChar_screen_x - 10, gameChar_world_y - 72.6, 4, 1.5, 1)
		rect(gameChar_screen_x - 3, gameChar_world_y - 72.6, 4, 1.5, 1)
	
		//blush
		fill(242, 119, 63)
		ellipse(gameChar_screen_x - 9, gameChar_world_y - 63, 3, 4)
		ellipse(gameChar_screen_x, gameChar_world_y - 63, 3, 4)
	
		//mouth
		stroke(0)
		line(gameChar_screen_x - 6, gameChar_world_y - 63,
			 gameChar_screen_x - 3, gameChar_world_y - 63)
	
		noStroke()

		//shadows
		fill(85, 0, 181)
		beginShape()
		vertex(gameChar_screen_x - 13, gameChar_world_y - 49)
		vertex(gameChar_screen_x + 15, gameChar_world_y - 49)
		vertex(gameChar_screen_x + 15, gameChar_world_y - 51)
		vertex(gameChar_screen_x + 13, gameChar_world_y - 51)
		vertex(gameChar_screen_x + 13, gameChar_world_y - 75)
		vertex(gameChar_screen_x + 10, gameChar_world_y - 75)
		vertex(gameChar_screen_x + 10, gameChar_world_y - 51)
		vertex(gameChar_screen_x - 13, gameChar_world_y - 51)
		endShape()

	}
	else if(isRight && isFalling)
	{
		// add your jumping-right code
		fill(85, 0, 181)
		beginShape()
		vertex(gameChar_screen_x - 7, gameChar_world_y - 33)
		vertex(gameChar_screen_x - 19, gameChar_world_y - 51)
		vertex(gameChar_screen_x - 24, gameChar_world_y - 51)
		endShape()

		//hands
		fill(255, 207, 156)
		ellipse(gameChar_screen_x + 20, gameChar_world_y - 45, 10, 10)
		ellipse(gameChar_screen_x - 20, gameChar_world_y - 45, 10, 10)

		//feet
		fill(233, 0, 241)
		beginShape()
		vertex(gameChar_screen_x - 15, gameChar_world_y - 27)
		vertex(gameChar_screen_x - 6, gameChar_world_y - 33)
		vertex(gameChar_screen_x - 2, gameChar_world_y - 28)
		endShape()

		//feet
		fill(233, 0, 241)
		beginShape()
		vertex(gameChar_screen_x + 6, gameChar_world_y - 27)
		vertex(gameChar_screen_x + 6, gameChar_world_y - 33)
		vertex(gameChar_screen_x + 2, gameChar_world_y - 28)
		endShape()
		
		stroke(242, 119, 63)
		line(gameChar_screen_x + 19, gameChar_world_y - 49, 
			gameChar_screen_x + 24, gameChar_world_y - 44)
		noStroke()

		stroke(242, 119, 63)
		line(gameChar_screen_x + 22, gameChar_world_y - 41,
			 gameChar_screen_x + 17, gameChar_world_y - 46)
		noStroke()

		stroke(242, 119, 63)
		line(gameChar_screen_x - 22, gameChar_world_y - 41,
			 gameChar_screen_x - 17, gameChar_world_y - 46)
		noStroke()

		stroke(242, 119, 63)
		line(gameChar_screen_x - 19, gameChar_world_y - 49,
			 gameChar_screen_x - 24, gameChar_world_y - 44)
		noStroke()

		//Purple Head and body
		fill(111,15,219);
		rect(gameChar_screen_x - 12, gameChar_world_y - 75, 25, 25)
		triangle(gameChar_screen_x - 22, gameChar_world_y - 51, gameChar_screen_x,
			 gameChar_world_y - 25, gameChar_screen_x + 22, gameChar_world_y - 51 )
		
		//Face
		fill(255,207,156)
		rect(gameChar_screen_x - 8, gameChar_world_y - 74, 20, 18)

		//Eyes
		fill(0)
		ellipse(gameChar_screen_x + 8, gameChar_world_y - 69, 3, 4)
		ellipse(gameChar_screen_x + 1, gameChar_world_y - 69, 3, 4)

		//eyebrows
		fill(121, 62, 0)
		rect(gameChar_screen_x + 6, gameChar_world_y - 72.6, 4, 1.5, 1)
		rect(gameChar_screen_x - 1, gameChar_world_y - 72.6, 4, 1.5, 1)

		//blush
		fill(242, 119, 63)
		ellipse(gameChar_screen_x + 9, gameChar_world_y - 63, 3, 4)
		ellipse(gameChar_screen_x, gameChar_world_y - 63, 3, 4)

		//mouth
		stroke(0)
		line(gameChar_screen_x + 6, gameChar_world_y - 63,
			 gameChar_screen_x + 3, gameChar_world_y - 63)

		noStroke()

		//shadows
		fill(85, 0, 181)
		beginShape()
		vertex(gameChar_screen_x + 13, gameChar_world_y - 49)
		vertex(gameChar_screen_x - 15, gameChar_world_y - 49)
		vertex(gameChar_screen_x - 15, gameChar_world_y - 51)
		vertex(gameChar_screen_x - 12, gameChar_world_y - 51)
		vertex(gameChar_screen_x - 12, gameChar_world_y - 75)
		vertex(gameChar_screen_x - 10, gameChar_world_y - 75)
		vertex(gameChar_screen_x - 10, gameChar_world_y - 51)
		vertex(gameChar_screen_x + 13, gameChar_world_y - 51)
		endShape()
	}
	else if(isLeft)
	{
		// add your walking left code
		//purple head and body
		fill(111,15,219);
		rect(gameChar_screen_x - 23, gameChar_world_y - 75, 35, 35)
		triangle(gameChar_screen_x + 20, gameChar_world_y - 6, gameChar_screen_x - 15,
			 gameChar_world_y - 70, gameChar_screen_x - 15, gameChar_world_y - 6 )
		
		//face
		fill(255,207,156)
		rect(gameChar_screen_x - 21, gameChar_world_y - 67, 26, 25)

		//eyes
		fill(0)
		ellipse(gameChar_screen_x - 15, gameChar_world_y - 55, 4, 6)
		ellipse(gameChar_screen_x - 5, gameChar_world_y - 55, 4, 6)

		//eyebrows
		fill(121, 62, 0)
		rect(gameChar_screen_x - 19, gameChar_world_y - 61.2, 8, 3, 1)
		rect(gameChar_screen_x - 9, gameChar_world_y - 61.2, 8, 3, 1)

		//blush
		fill(242, 119, 63)
		ellipse(gameChar_screen_x - 16, gameChar_world_y - 48, 4, 5)
		ellipse(gameChar_screen_x - 4, gameChar_world_y - 48, 4, 5)

		//mouth
		stroke(0)
		line(gameChar_screen_x - 13, gameChar_world_y - 48,
			 gameChar_screen_x - 7, gameChar_world_y - 48)

		noStroke()

		//feet
		fill(233, 0, 241)
		beginShape()
		vertex(gameChar_screen_x + 14, gameChar_world_y - 1)
		vertex(gameChar_screen_x + 14, gameChar_world_y - 6)
		vertex(gameChar_screen_x + 3, gameChar_world_y - 6)
		vertex(gameChar_screen_x, gameChar_world_y - 1)
		endShape()

		beginShape()
		vertex(gameChar_screen_x - 17, gameChar_world_y - 1)
		vertex(gameChar_screen_x - 14, gameChar_world_y - 6)
		vertex(gameChar_screen_x - 3, gameChar_world_y - 6)
		vertex(gameChar_screen_x - 3, gameChar_world_y - 1)
		endShape()
	}
	else if(isRight)
	{
		// add your walking right code
		//purple head and body
		fill(111,15,219);
		rect(gameChar_screen_x - 12, gameChar_world_y - 75, 35, 35)
		triangle(gameChar_screen_x - 20, gameChar_world_y - 6, gameChar_screen_x + 15,
			 gameChar_world_y - 70, gameChar_screen_x + 15, gameChar_world_y - 6 )
		
		//face
		fill(255,207,156)
		rect(gameChar_screen_x - 5, gameChar_world_y - 67, 26, 25)

		//eyes
		fill(0)
		ellipse(gameChar_screen_x + 15, gameChar_world_y - 55, 4, 6)
		ellipse(gameChar_screen_x + 5, gameChar_world_y - 55, 4, 6)

		//eyebrows
		fill(121, 62, 0)
		rect(gameChar_screen_x + 11, gameChar_world_y - 61.2, 8, 3, 1)
		rect(gameChar_screen_x + 1, gameChar_world_y - 61.2, 8, 3, 1)

		//blush
		fill(242, 119, 63)
		ellipse(gameChar_screen_x + 16, gameChar_world_y - 48, 4, 5)
		ellipse(gameChar_screen_x + 4, gameChar_world_y - 48, 4, 5)

		//mouth
		stroke(0)
		line(gameChar_screen_x + 13, gameChar_world_y - 48,
			 gameChar_screen_x + 7, gameChar_world_y - 48)

		noStroke()

		//feet
		fill(233, 0, 241)
		beginShape()
		vertex(gameChar_screen_x - 14, gameChar_world_y - 1)
		vertex(gameChar_screen_x - 14, gameChar_world_y - 6)
		vertex(gameChar_screen_x - 3, gameChar_world_y - 6)
		vertex(gameChar_screen_x, gameChar_world_y - 1)
		endShape()

		beginShape()
		vertex(gameChar_screen_x + 17, gameChar_world_y - 1)
		vertex(gameChar_screen_x + 14, gameChar_world_y - 6)
		vertex(gameChar_screen_x + 3, gameChar_world_y - 6)
		vertex(gameChar_screen_x + 3, gameChar_world_y - 1)
		endShape()
	}
	else if(isFalling || isPlummeting)
	{
		// add your jumping facing forwards code
		//hands
		fill(255, 207, 156)
		ellipse(gameChar_screen_x + 20, gameChar_world_y - 45, 10, 10)
		ellipse(gameChar_screen_x - 20, gameChar_world_y - 45, 10, 10)

		//feet
		fill(233, 0, 241)
		beginShape()
		vertex(gameChar_screen_x - 12, gameChar_world_y - 27)
		vertex(gameChar_screen_x - 6, gameChar_world_y - 33)
		vertex(gameChar_screen_x - 2, gameChar_world_y - 28)
		endShape()

		//feet
		fill(233, 0, 241)
		beginShape()
		vertex(gameChar_screen_x + 12, gameChar_world_y - 27)
		vertex(gameChar_screen_x + 6, gameChar_world_y - 33)
		vertex(gameChar_screen_x + 2, gameChar_world_y - 28)
		endShape()
		
		stroke(242, 119, 63)
		line(gameChar_screen_x + 19, gameChar_world_y - 49,
			 gameChar_screen_x + 24, gameChar_world_y - 44)
		noStroke()

		stroke(242, 119, 63)
		line(gameChar_screen_x + 22, gameChar_world_y - 41,
			 gameChar_screen_x + 17, gameChar_world_y - 46)
		noStroke()

		stroke(242, 119, 63)
		line(gameChar_screen_x - 22, gameChar_world_y - 41,
			 gameChar_screen_x - 17, gameChar_world_y - 46)
		noStroke()

		stroke(242, 119, 63)
		line(gameChar_screen_x - 19, gameChar_world_y - 49,
			 gameChar_screen_x - 24, gameChar_world_y - 44)
		noStroke()

		//Purple Head and body
		fill(111,15,219);
		rect(gameChar_screen_x - 12, gameChar_world_y - 75, 25, 25)
		triangle(gameChar_screen_x - 22, gameChar_world_y - 51, gameChar_screen_x,
			 gameChar_world_y - 25, gameChar_screen_x + 22, gameChar_world_y - 51 )
		
		//Face
		fill(255,207,156)
		rect(gameChar_screen_x - 9, gameChar_world_y - 74, 20, 18)

		//Eyes
		fill(0)
		ellipse(gameChar_screen_x + 5, gameChar_world_y - 67, 3, 4)
		ellipse(gameChar_screen_x - 2, gameChar_world_y - 67, 3, 4)

		//eyebrows
		fill(121, 62, 0)
		rect(gameChar_screen_x + 3, gameChar_world_y - 70.5, 4, 1.5, 1)
		rect(gameChar_screen_x - 4, gameChar_world_y - 70.5, 4, 1.5, 1)

		//blush
		fill(242, 119, 63)
		ellipse(gameChar_screen_x + 6, gameChar_world_y - 61, 3, 4)
		ellipse(gameChar_screen_x - 3, gameChar_world_y - 61, 3, 4)

		//mouth
		stroke(0)
		line(gameChar_screen_x, gameChar_world_y - 61,
			 gameChar_screen_x + 3.5, gameChar_world_y - 61)

		noStroke()

		fill(85, 0, 181)
		beginShape()
		vertex(gameChar_screen_x - 13, gameChar_world_y - 49)
		vertex(gameChar_screen_x - 13, gameChar_world_y - 51)
		vertex(gameChar_screen_x + 15, gameChar_world_y - 51)
		vertex(gameChar_screen_x + 15, gameChar_world_y - 49)
		endShape()	
	}
	else
	{
		// add your standing front facing code
		fill(111,15,219);
		rect(gameChar_screen_x - 17.6, gameChar_world_y - 75, 35, 35)
		triangle(gameChar_screen_x - 20, gameChar_world_y - 6, gameChar_screen_x, 
			gameChar_world_y - 70, gameChar_screen_x + 20, gameChar_world_y - 6 )
		
		fill(255,207,156)
		rect(gameChar_screen_x - 13, gameChar_world_y - 67, 26, 25)

		fill(0)
		ellipse(gameChar_screen_x + 6, gameChar_world_y - 55, 4, 6)
		ellipse(gameChar_screen_x - 5, gameChar_world_y - 55, 4, 6)

		fill(121, 62, 0)
		rect(gameChar_screen_x + 2, gameChar_world_y - 61.2, 8, 3, 1)
		rect(gameChar_screen_x - 9, gameChar_world_y - 61.2, 8, 3, 1)

		fill(242, 119, 63)
		ellipse(gameChar_screen_x + 7, gameChar_world_y - 48, 4, 5)
		ellipse(gameChar_screen_x - 6, gameChar_world_y - 48, 4, 5)

		stroke(0)
		line(gameChar_screen_x - 2, gameChar_world_y - 48,
			 gameChar_screen_x + 3, gameChar_world_y - 48)

		noStroke()

		fill(233, 0, 241)
		beginShape()
		vertex(gameChar_screen_x - 17, gameChar_world_y - 1)
		vertex(gameChar_screen_x - 14, gameChar_world_y - 6)
		vertex(gameChar_screen_x - 3, gameChar_world_y - 6)
		vertex(gameChar_screen_x - 3, gameChar_world_y - 1)
		endShape()

		beginShape()
		vertex(gameChar_screen_x + 17, gameChar_world_y - 1)
		vertex(gameChar_screen_x + 14, gameChar_world_y - 6)
		vertex(gameChar_screen_x + 3, gameChar_world_y - 6)
		vertex(gameChar_screen_x + 3, gameChar_world_y - 1)
		endShape()

		//Used to implement side-scrolling
		

	}
}

//Render Background world functions
function drawClouds()
{
	for (const c of clouds){

		//Cloud_1 far left
		fill(208, 230, 222)
		beginShape()
		vertex(c.x_pos + 260, c.y_pos + 97)
		vertex(c.x_pos + 295, c.y_pos + 66)
		vertex(c.x_pos + 317, c.y_pos + 78)
		vertex(c.x_pos + 356, c.y_pos + 64)
		vertex(c.x_pos + 370, c.y_pos + 71)
		vertex(c.x_pos + 383, c.y_pos + 107)
		vertex(c.x_pos + 397, c.y_pos + 112)
		vertex(c.x_pos + 414, c.y_pos + 135)
		vertex(c.x_pos + 243, c.y_pos + 135)
		endShape()

		//Cloud_2 middle left
		fill(208, 230, 222)
		beginShape()
		vertex(c.x_pos + 397, c.y_pos + 85)
		vertex(c.x_pos + 421, c.y_pos + 104)
		vertex(c.x_pos + 462, c.y_pos + 93)
		vertex(c.x_pos + 482, c.y_pos + 101)
		vertex(c.x_pos + 504, c.y_pos + 82)
		vertex(c.x_pos + 523, c.y_pos + 91)
		vertex(c.x_pos + 536, c.y_pos + 67)
		vertex(c.x_pos + 516, c.y_pos + 41)
		vertex(c.x_pos + 470, c.y_pos + 32)
		vertex(c.x_pos + 455, c.y_pos + 54)
		vertex(c.x_pos + 427, c.y_pos + 45)
		endShape()

		//Cloud_3 middle right
		fill(208, 230, 222)
		beginShape()
		vertex(c.x_pos + 594, c.y_pos + 65)
		vertex(c.x_pos + 611, c.y_pos + 56)
		vertex(c.x_pos + 657, c.y_pos + 67)
		vertex(c.x_pos + 671, c.y_pos + 92)
		vertex(c.x_pos + 690, c.y_pos + 94)
		vertex(c.x_pos + 697, c.y_pos + 101)
		vertex(c.x_pos + 697, c.y_pos + 107)
		vertex(c.x_pos + 596, c.y_pos + 107)
		endShape()

		//Cloud_4 far right
		fill(208, 230, 222)
		beginShape()
		vertex(c.x_pos + 873, c.y_pos + 92)
		vertex(c.x_pos + 867, c.y_pos + 77)
		vertex(c.x_pos + 933, c.y_pos + 68)
		vertex(c.x_pos + 936, c.y_pos + 42)
		vertex(c.x_pos + 992, c.y_pos + 23)
		vertex(c.x_pos + 1024, c.y_pos + 55)
		vertex(c.x_pos + 1026, c.y_pos + 65)
		vertex(c.x_pos + 1026, c.y_pos + 75)
		vertex(c.x_pos + 1010, c.y_pos + 98)
		vertex(c.x_pos + 990, c.y_pos + 94)
		endShape()

	}
}

function drawMountains()
{
	for (const m of mountains){

		//background mountain middle right
		fill(219, 219, 219)
		beginShape()
		vertex(m.x_pos + 670, m.y_pos + 226)
		vertex(m.x_pos + 677, m.y_pos + 183)
		vertex(m.x_pos + 722, m.y_pos + 65)
		vertex(m.x_pos + 851, m.y_pos + 106)
		vertex(m.x_pos + 980, m.y_pos + 223)
		vertex(m.x_pos + 894, m.y_pos + 320)
		vertex(m.x_pos + 862, m.y_pos + 268)
		vertex(m.x_pos + 840, m.y_pos + 306)
		endShape()
	
		fill(154, 154, 154)
		beginShape()
		vertex(m.x_pos + 840, m.y_pos + 303)
		vertex(m.x_pos + 862, m.y_pos + 268)
		vertex(m.x_pos + 882, m.y_pos + 300)
		vertex(m.x_pos + 863, m.y_pos + 327)
		endShape()
	
		//shadows for background mountain middle right
		fill(106, 114, 121)
		beginShape()
		vertex(m.x_pos + 863, m.y_pos + 327)
		vertex(m.x_pos + 840, m.y_pos + 303)
		vertex(m.x_pos + 862, m.y_pos + 268)
		endShape()
	
		fill(189, 205, 219)
		beginShape()
		vertex(m.x_pos + 821, m.y_pos + 280)
		vertex(m.x_pos + 840, m.y_pos + 303)
		vertex(m.x_pos + 862, m.y_pos + 268)
		vertex(m.x_pos + 861, m.y_pos + 216)
		endShape()
	
		fill(189, 205, 219)
		beginShape()
		vertex(m.x_pos + 851, m.y_pos + 106)
		vertex(m.x_pos + 918, m.y_pos + 245)
		vertex(m.x_pos + 952, m.y_pos + 196)
		endShape()
	
		fill(189, 205, 219)
		beginShape()
		vertex(m.x_pos + 751, m.y_pos + 74)
		vertex(m.x_pos + 786, m.y_pos + 145)
		vertex(m.x_pos + 823, m.y_pos + 97)
		endShape()

		//Background Mountain centre
		fill(154,154,154)
		beginShape()
		vertex(m.x_pos + 400, m.y_pos + 272)
		vertex(m.x_pos + 576, m.y_pos + 40)
		vertex(m.x_pos + 752, m.y_pos + 272)
		endShape()

		fill(219, 219, 219)
		beginShape()
		vertex(m.x_pos + 576, m.y_pos + 40)
		vertex(m.x_pos + 508, m.y_pos + 128)
		vertex(m.x_pos + 530, m.y_pos + 191)
		vertex(m.x_pos + 568, m.y_pos + 145)
		vertex(m.x_pos + 613, m.y_pos + 215)
		vertex(m.x_pos + 656, m.y_pos + 146)
		endShape()

		//shadows for mountain centre
		fill(189, 205, 219)
		beginShape()
		vertex(m.x_pos + 576, m.y_pos + 40)
		vertex(m.x_pos + 656, m.y_pos + 146)
		vertex(m.x_pos + 633, m.y_pos + 183)
		vertex(m.x_pos + 572, m.y_pos + 46)
		endShape()

		beginShape()
		vertex(m.x_pos + 568, m.y_pos + 145)
		vertex(m.x_pos + 568, m.y_pos + 94)
		vertex(m.x_pos + 515, m.y_pos + 151)
		vertex(m.x_pos + 530, m.y_pos + 191)
		endShape()

		fill(106, 114, 121)
		beginShape()
		vertex(m.x_pos + 568, m.y_pos + 145)
		vertex(m.x_pos + 530, m.y_pos + 191)
		vertex(m.x_pos + 515, m.y_pos + 151)
		vertex(m.x_pos + 490, m.y_pos + 177)
		vertex(m.x_pos + 562, m.y_pos + 213)
		endShape()

		//Background Mountain Left
		fill(154, 154, 154)
		beginShape()
		vertex(m.x_pos + 355, m.y_pos + 175)
		vertex(m.x_pos + 220, m.y_pos + 66)
		vertex(m.x_pos + 68, m.y_pos + 66)
		vertex(m.x_pos, m.y_pos + 181)
		vertex(m.x_pos - 10, m.y_pos + 432)
		vertex(m.x_pos + 347, m.y_pos + 431)
		endShape()

		//Grey draw for background mountain left
		fill(219, 219, 219)
		beginShape()
		vertex(m.x_pos + 352, m.y_pos + 173)
		vertex(m.x_pos + 220, m.y_pos + 66)
		vertex(m.x_pos + 68, m.y_pos + 66)
		vertex(m.x_pos, 181)
		vertex(m.x_pos + 54, m.y_pos + 136)
		vertex(m.x_pos + 144, m.y_pos + 270)
		vertex(m.x_pos + 234, m.y_pos + 140)
		vertex(m.x_pos + 304, m.y_pos + 205)
		endShape()

		//Shadows for background left mountain
		fill(106, 114, 121)
		beginShape()
		vertex(m.x_pos + 233, m.y_pos + 225)
		vertex(m.x_pos + 234, m.y_pos + 140)
		vertex(m.x_pos + 163, m.y_pos + 241)
		endShape()

		fill(189, 205, 219)
		beginShape()
		vertex(m.x_pos + 234, m.y_pos + 140)
		vertex(m.x_pos + 162, m.y_pos + 241)
		vertex(m.x_pos + 144, m.y_pos + 246)
		vertex(m.x_pos + 177, m.y_pos + 95)
		endShape()

		fill(189, 205, 219)
		beginShape()
		vertex(m.x_pos + 220, m.y_pos + 66)
		vertex(m.x_pos + 185, m.y_pos + 65)
		vertex(m.x_pos + 333, m.y_pos + 189)
		vertex(m.x_pos + 353, m.y_pos + 174)
		endShape()

		//foreground grey mountain draw
		fill(76,116,151)
		beginShape()
		vertex(m.x_pos - 100, m.y_pos + 432)
		vertex(m.x_pos + 50, m.y_pos + 272)
		vertex(m.x_pos + 304, m.y_pos + 206)
		vertex(m.x_pos + 410, m.y_pos + 138)
		vertex(m.x_pos + 564, m.y_pos + 214)
		vertex(m.x_pos + 767,m.y_pos + 224)
		vertex(m.x_pos + 961,m.y_pos + 432)
		endShape()

		//foreground grey mountian shadows
		fill(49, 93, 132)
		beginShape()
		vertex(m.x_pos + 410,m.y_pos + 138)
		vertex(m.x_pos + 564,m.y_pos + 214)
		vertex(m.x_pos + 540,m.y_pos + 261)
		endShape()

		beginShape()
		vertex(m.x_pos + 767,m.y_pos + 224)
		vertex(m.x_pos + 961,m.y_pos + 432)
		vertex(m.x_pos + 860,m.y_pos + 432)
		vertex(m.x_pos + 792,m.y_pos + 350)
		endShape()

		beginShape()
		vertex(m.x_pos + 163, m.y_pos + 432)
		vertex(m.x_pos + 270, m.y_pos + 240)
		vertex(m.x_pos + 265, m.y_pos + 322)
		vertex(m.x_pos + 314, m.y_pos + 376)
		vertex(m.x_pos + 314, m.y_pos + 432)
		endShape()

		beginShape()
		vertex(m.x_pos + 761, m.y_pos + 432)
		vertex(m.x_pos + 616, m.y_pos + 432)
		vertex(m.x_pos + 643, m.y_pos + 361)
		endShape()

		triangle(m.x_pos + 520, m.y_pos + 340, m.x_pos + 
			544, m.y_pos + 288, m.x_pos + 560, m.y_pos + 
			386)

		//further foreground mountain right draw
		fill(154, 154, 154)
		beginShape()
		vertex(m.x_pos + 791, m.y_pos + 432)
		vertex(m.x_pos + 1024, m.y_pos + 90)
		vertex(m.x_pos + 1056, m.y_pos + 432)
		endShape()
	
		//shadows for further foreground mountain right side
		fill(219, 219, 219)
		beginShape()
		vertex(m.x_pos + 1024, m.y_pos + 90)
		vertex(m.x_pos + 817, m.y_pos + 394)
		vertex(m.x_pos + 872, m.y_pos + 380)
		vertex(m.x_pos + 944, m.y_pos + 341)
		vertex(m.x_pos + 958, m.y_pos + 397)
		vertex(m.x_pos + 1024, m.y_pos + 300)
		endShape()
	
		fill(189,205,219)
		beginShape()
		vertex(m.x_pos + 872, m.y_pos + 380)
		vertex(m.x_pos + 952, m.y_pos + 284)
		vertex(m.x_pos + 944, m.y_pos + 341)
		endShape()
	
		fill(106,114,121)
		beginShape()
		vertex(m.x_pos + 886, m.y_pos + 432)
		vertex(m.x_pos + 872, m.y_pos + 380)
		vertex(m.x_pos + 944, m.y_pos + 341)
		vertex(m.x_pos + 921, m.y_pos + 432)
		endShape()
	
	}
}

function drawTrees()
{
	for (const t of trees){

		//DRAW TREE
		//Tree 1
		fill(16, 116, 0)
		triangle(t.x_pos + 614, t.y_pos + 412, t.x_pos + 
			645, t.y_pos + 356, t.x_pos + 676, t.y_pos + 412)
		triangle(t.x_pos + 614, t.y_pos + 374, t.x_pos + 
			645, t.y_pos + 324, t.x_pos + 676, t.y_pos + 374)

		fill(173, 121, 28)
		rect(t.x_pos + 637, t.y_pos + 412, 20, 20)

		fill(131, 84, 8)
		triangle(t.x_pos + 637, t.y_pos + 412, t.x_pos + 
			657, t.y_pos + 411, t.x_pos + 657, t.y_pos + 431)

		//shadows for tree 1 
		fill(12, 90, 0)
		beginShape()
		vertex(t.x_pos + 641, t.y_pos + 332)
		vertex(t.x_pos + 645, t.y_pos + 324)
		vertex(t.x_pos + 676, t.y_pos + 374)
		vertex(t.x_pos + 664, t.y_pos + 374)
		endShape()

		beginShape()
		vertex(t.x_pos + 659, t.y_pos + 374)
		vertex(t.x_pos + 634, t.y_pos + 374)
		vertex(t.x_pos + 660, t.y_pos + 412)
		vertex(t.x_pos + 676, t.y_pos + 412)
		endShape()

		//Tree #2
		fill(16, 116, 0)
		triangle(t.x_pos + 663, t.y_pos + 407, t.x_pos + 
			692, t.y_pos + 347, t.x_pos + 724, t.y_pos + 407)
		triangle(t.x_pos + 666, t.y_pos + 362, t.x_pos + 
			692, t.y_pos + 322, t.x_pos + 716, t.y_pos + 362)

		fill(173, 121, 28)
		rect(t.x_pos + 686, t.y_pos + 407, 16, 25)


		//shadows for tree 2
		fill(131, 84, 8)
		triangle(t.x_pos + 686, t.y_pos + 405, t.x_pos + 
			702, t.y_pos + 406, t.x_pos + 702, t.y_pos + 432)
		
		fill(12, 90, 0)
		beginShape()
		vertex(t.x_pos + 688, t.y_pos + 325)
		vertex(t.x_pos + 692, t.y_pos + 321)
		vertex(t.x_pos + 716, t.y_pos + 362)
		vertex(t.x_pos + 703, t.y_pos + 362)
		endShape()

		beginShape()
		vertex(t.x_pos + 703, t.y_pos + 362)
		vertex(t.x_pos + 681, t.y_pos + 362)
		vertex(t.x_pos + 712, t.y_pos + 407)
		vertex(t.x_pos + 724, t.y_pos + 407)
		endShape()
		
	}
}

function drawCollectable(t_collectable)
{
	//Checking to see if collecatble is found and if not then draw it
	if(t_collectable.isFound == false){
		fill(222, 173, 25)
		ellipse(t_collectable.x_pos, t_collectable.y_pos - 50,
			 t_collectable.size * 1.1, t_collectable.size * 1.1)
		fill(222, 194, 25)
		ellipse(t_collectable.x_pos, t_collectable.y_pos - 50,
			 t_collectable.size, t_collectable.size)
		fill(222, 173, 25)
		ellipse(t_collectable.x_pos, t_collectable.y_pos - 50,
			 t_collectable.size, t_collectable.size * 1/6)
		ellipse(t_collectable.x_pos, t_collectable.y_pos - 50,
			 t_collectable.size * 1/6, t_collectable.size)
		fill(222, 153, 25)
		ellipse(t_collectable.x_pos,  t_collectable.y_pos - 50,
			 t_collectable.size * 1/14, t_collectable.size)
		ellipse(t_collectable.x_pos, t_collectable.y_pos - 50, 
			t_collectable.size, t_collectable.size * 1/14)

	}
}

function drawCanyon(t_canyon)
{
	fill(154, 154, 154)
	rect(t_canyon.x_pos, floorPos_y, t_canyon.width + 50, height)
	fill(76,116,151)
	rect(t_canyon.x_pos + 20, floorPos_y, t_canyon.width + 10, height)
}

function checkCollectable(t_collectable)
{
	//Calculates distance between player and collectable
	//If player is close enough then collecatble is "collected" and game_score updates
	if(dist(gameChar_screen_x, gameChar_world_y,
			 t_collectable.x_pos, t_collectable.y_pos) < 20){
		t_collectable.isFound = true;
		console.log(collectables.isFound)
		game_score += 1
        collectableSound.play()
	}
}

function checkCanyon(t_canyon)
{
	// Checks to see if player is over the canyon and less then floorPos_y
	if(gameChar_screen_x > t_canyon.x_pos + 20 && gameChar_screen_x < t_canyon.x_pos 
		+ t_canyon.width && gameChar_world_y >= floorPos_y){
		isPlummeting = true
	}
}

function renderFlagpole(){
	push()
	strokeWeight(5)
	stroke(0)
	line(flagpole.x_pos, floorPos_y, flagpole.x_pos, floorPos_y - 100)
	fill(255, 0, 0)
	noStroke()
	//Draw for when pole is reached or not reached
	if(flagpole.isReached){
		rect(flagpole.x_pos, floorPos_y - 100, -50, 40)
	}
	else{
		rect(flagpole.x_pos, floorPos_y - 40, -50, 40)
	}
	
	pop()
}

function checkFlagpole(){
	const d = abs(gameChar_screen_x - flagpole.x_pos)

	//Checks distance between player and pole
	//Sets isReached to true if player is close enough
	if(d < 10){
		flagpole.isReached = true
		checkpointSound.play()
	}
}

//Function check if the player is still alive
function checkPlayerDie(){
	//Restarts game if player loses a life
	if(gameChar_world_y > 576 && lives > 0){
		lives -= 1
		deathSound.play()
		startGame()
	}

}

//Function to start game
function startGame(){
	gameChar_screen_x = width/2;
	gameChar_world_x = gameChar_screen_x
	gameChar_screen_y = floorPos_y
	gameChar_world_y = gameChar_screen_y
	cameraPos_x = 0
	cameraPos_y = 0

	isLeft = false
	isRight = false
	isPlummeting = false
	isFalling = false

	//Tree Array
	trees = [
		{x_pos: -1900, y_pos: 0},
		{x_pos: -1700, y_pos: 0},
		{x_pos: -1500, y_pos: 0},
		{x_pos: -1100, y_pos: 0},
		{x_pos: -900, y_pos: 0},
		{x_pos: -700, y_pos: 0},
		{x_pos: -500, y_pos: 0},
		{x_pos: -100, y_pos: 0},
		{x_pos: 150, y_pos: 0},
		{x_pos: 200, y_pos: 0},
		{x_pos: 500, y_pos: 0},
		{x_pos: 700, y_pos: 0},
		{x_pos: 1550, y_pos: 0},
		{x_pos: 1700, y_pos: 0},
		{x_pos: 1900, y_pos: 0},
		{x_pos: 2200, y_pos: 0},
		{x_pos: 2500, y_pos: 0},
	]

	//Clouds Array
	clouds = [
		{x_pos: random(-1900, 1900), y_pos: random(0, -100)},
		{x_pos: random(-1900, 1900), y_pos: random(0, -100)},
		{x_pos: random(-1900, 1900), y_pos: random(0, -100)},
		{x_pos: random(-1900, 1900), y_pos: random(0, -100)},
		{x_pos: random(-1900, 1900), y_pos: random(0, -100)},
		{x_pos: random(-1900, 1900), y_pos: random(0, -100)},
		{x_pos: random(-1900, 1900), y_pos: random(0, -100)},
		{x_pos: random(-1900, 1900), y_pos: random(0, -100)},
		{x_pos: random(-1900, 1900), y_pos: random(0, -100)},
		{x_pos: random(-1900, 1900), y_pos: random(0, -100)}
	]

	//Mountain Array
	mountains = [
		{x_pos: -2500, y_pos: 0},
		{x_pos: -2000, y_pos: 0},
		{x_pos: -1600, y_pos: 0},
		{x_pos: -1000, y_pos: 0},
		{x_pos: -800, y_pos: 0},
		{x_pos: -300, y_pos: 0},
		{x_pos: 100, y_pos: 0},
		{x_pos: 500, y_pos: 0},
		{x_pos: 800, y_pos: 0},
		{x_pos: 1200, y_pos: 0},
		{x_pos: 1500, y_pos: 0},
		{x_pos: 1800, y_pos: 0},
		{x_pos: 2100, y_pos: 0},
	]

	cameraPosX = 0

	// Collectable Array of Object
	collectables = [
		collectable_1 = {
			x_pos: 175,
			y_pos: floorPos_y - 95,
			size: 50,
			isFound: false
		},

		collectable_2 = {
			x_pos: -850,
			y_pos: floorPos_y,
			size: 50,
			isFound: false
		},

		collectable_3 = {
			x_pos: 1440,
			y_pos: floorPos_y - 275,
			size: 50,
			isFound: false
		},

		collectable_4 = {
			x_pos: -1800,
			y_pos: floorPos_y,
			size: 50,
			isFound: false
		},

		collectable_5 = {
			x_pos: -1490,
			y_pos: floorPos_y - 440,
			size: 50,
			isFound: false
		},

		collectable_6 = {
			x_pos: 1950,
			y_pos: floorPos_y - 350,
			size: 50,
			isFound: false
		}
	]

	//Canyon Array of Objects
	canyons = [
		canyon_1 = {
			x_pos: 250,
			width: 100
		},

		canyon_2 = {
			x_pos: -200,
			width: 100
		},

		canyon_3 = {
			x_pos: 900,
			width: 150
		},

		canyon_4 = {
			x_pos: -800,
			width: 250
		},
		
		canyon_5 = {
			x_pos: -1800,
			width: 500
		},

		canyon_6 = {
			x_pos: 1480,
			width: 650
		}

	]

	enemies_1 = []
	enemies_2 = []
	
	//Creating new enemies and pushing it to the required array
	for(var e = 0; e < 6; e++){
		enemies_1.push(new Enemy(-50 + e*15, floorPos_y, 220))
	}

	for(var e = 0; e < 6; e++){
		enemies_1.push(new Enemy(1150 + e*15, floorPos_y, 260))
	}

	for(var e = 0; e < 6; e++){
		enemies_1.push(new Enemy(-1200 + e*15, floorPos_y, 260))
	}

	enemies_2.push(new Enemy_2(700, floorPos_y-80, 80))
	enemies_2.push(new Enemy_2(-350, floorPos_y-80, 80))

	game_score = 0

	//Sets flagpole position in world
	flagpole = {
		isReached: false,
		x_pos: 2500
	}
	
}


class Platform
{
	constructor(x, y, length){
		this.x = x
		this.y = y
		this.length = length
	}
	//method to draw platform
	drawPlatform()
	{
		fill(244,164,96)
		rect(this.x, this.y, this.length, 10)
	}

	update(){

	}

	//Method to see if player is in contact with platform
	checkContact(gc_x, gc_y)
	{
		if(gc_x > this.x && gc_x < this.x + this.length)
		{
			const d = this.y - gc_y
			console.log(d)
			if(d >= -30 && d < 5){
					return true
				}
			}

			return false
		}
}

class MovingPlatform extends Platform{
	constructor(x, y, length, range){
		super(x, y, length)
		this.range = range
		this.anchor = x
		this.direction = 1
	}

	//Method to move the platform within the range given
	update(){
		if(abs(this.anchor - this.x) > this.range){
			this.direction *= -1
		}

		this.x += this.direction
		
	}
}

function Enemy(x, y, range){
	this.x = x
	this.y = y
	this.range = range
	
	this.currentX = x
	this.inc = 1

	//Method to update position of enemy
	this.update = function()
	{
		this.currentX += this.inc

		if(this.currentX >= this.x + this.range)
		{
			this.inc = -1
		} else if(this.currentX < this.x){
			this.inc = 1
		}
	}

	//Method to draw enemy
	this.draw = function()
	{
		this.update()
		fill(175, 0, 0)
		rect(this.currentX, this.y, 5, -20)
		triangle(this.currentX - 5, this.y - 20, this.currentX + 3, 
				this.y - 30, this.currentX + 10, this.y - 20)
	}

	//Method to calculate the dist between player and enemy
	// Used to check if in contact
	this.checkContact = function(gc_x, gc_y)
	{
		const d = dist(gc_x, gc_y, this.currentX, this.y)
		if(d < 15)
		{
			return true
		}

		return false
	}
}


function Enemy_2(x, y, range){
	this.x = x
	this.y = y
	this.range = range
	
	this.currentX = x
	this.currentY = y
	this.inc = 1

	this.update = function()
	{
		this.currentY += this.inc

		if(this.currentY >= this.y + this.range)
		{
			this.inc = -1
		} else if(this.currentY < this.y){
			this.inc = 1
		}
	}

	this.draw = function()
	{
		this.update()
		fill(175, 150, 0)
		triangle(this.currentX, this.currentY, this.currentX + 15,
				 this.currentY - 30, this.currentX + 30, this.currentY)
		fill(240,230,140)
		triangle(this.currentX + 5, this.currentY, this.currentX + 15,
				 this.currentY - 15, this.currentX + 25, this.currentY)
		fill(255)
		rect(this.currentX + 6, this.currentY - 20, 7, 7)
		rect(this.currentX + 18, this.currentY - 20, 7, 7)
		fill(0)
		ellipse(this.currentX + 9, this.currentY - 16.5, 4, 4)
		ellipse(this.currentX + 21.5, this.currentY - 16.5, 4, 4)
	}

	this.checkContact = function(gc_x, gc_y)
	{
		const d = dist(gc_x, gc_y, this.currentX + 15, this.currentY - 15)
		if(d < 20)
		{
			return true
		}
		return false
	}
}

function checkEnemies(){
	//Draws Enemy and checks if player is touching the enemy
	//If the player is the game is reset and you lose a life
	for(const e of enemies_1)
	{
		e.draw()

		let isContact = e.checkContact(gameChar_screen_x, gameChar_world_y)

		if(isContact){
			if(lives > 0){
				startGame()
				lives -= 1
				deathSound.play()
				break
			}
		}
	}

	for(const e of enemies_2)
	{
		e.draw()

		let isContact = e.checkContact(gameChar_screen_x, gameChar_world_y - 30)

		if(isContact){
			if(lives > 0){
				startGame()
				lives -= 1
				deathSound.play()
				break
			}
		}
	}
}

function pushPlatforms(){
	//Creating new platforms
	platforms.push(new Platform(100, floorPos_y - 70, 150))
	platforms.push(new MovingPlatform(-700, floorPos_y - 50, 100, 100))
	platforms.push(new MovingPlatform(-1600, floorPos_y - 50, 150, 200))
	platforms.push(new Platform(-1800, floorPos_y - 150, 150))

	for(let i = 0; i < 1; i++){
		platforms.push(new Platform(platforms.at(-1).x + 80,
										platforms.at(-1).y - 100,
										150))
	}

	platforms.push(new MovingPlatform(-1500, floorPos_y - 250, 100, 75))
	platforms.push(new Platform(-1425, floorPos_y - 350, 150))
	for(let i = 0; i < 1; i++){
		platforms.push(new Platform(platforms.at(-1).x - 80,
										platforms.at(-1).y - 100,
										150))
	}

	platforms.push(new MovingPlatform(1800, floorPos_y - 290, 150, 150))

	platforms.push(new Platform(1200, floorPos_y - 90, 150))

	for(let i = 0; i < 2; i++){
		platforms.push(new Platform(platforms.at(-1).x + 80,
										platforms.at(-1).y - 100,
										150))
	}
}


function Particle(x, y, xSpeed, ySpeed, size, colour)
{
	this.x = x
	this.y = y
	this.xSpeed = xSpeed
	this.ySpeed = ySpeed
	this.size = size
	this.colour = colour
	this.age = 0

	this.drawParticle = function(){
		fill(this.colour)
		ellipse(this.x, this.y, this.size)
	}

	this.updateParticle = function(){
		this.x += this.xSpeed
		this.y += this.ySpeed
		this.age++
	}
}

function Emitter(x, y, xSpeed, ySpeed, size, colour){
	this.x = x
	this.y = y
	this.xSpeed = xSpeed
	this.ySpeed = ySpeed
	this.size = size
	this.colour = colour

	this.lifetime = 0
	this.startParticles = 0

	this.particles = []

	//Method to create new particles
	this.addParticle = function(){
		const p = new Particle(random(this.x -10, this.x + 10),
								random(this.y - 10, this.y + 10), 
								random(this.xSpeed - 1, this.xSpeed + 1),
			 					random(this.ySpeed - 1, this.ySpeed + 1), 
								random(this.size - 2, this.size + 2), 
								this.colour)

		return p
	}

	//Method to Start emitting particles
	this.startEmitter = function(startParticles, lifetime){
		this.startParticles = startParticles
		this.lifetime = lifetime

		//start emitter with initial particles
		for(let i = 0; i < startParticles; i++){
			this.particles.push(this.addParticle())
		}
	}

	//Method to iterate through particles and draw them
	this.updateParticles = function(){
		let deadParticles = 0
		for(let i = this.particles.length - 1; i >= 0; i--)
		{
			this.particles[i].drawParticle()
			this.particles[i].updateParticle()
			if(this.particles[i].age > random(0, this.lifetime)){
				this.particles.splice(i, 1)
				deadParticles++
			}
		}

		if(deadParticles > 0){
			for(let i = 0; i < deadParticles; i++){
				this.particles.push(this.addParticle())
			}
		}
	} 
}
