var score = 0;
var s;
var sword, swordImage, gameOverImage;

var video;
var handPose;
var hands;
var Switch = 0;
var canvasWidth = 800;
var canvasHeight = 600;
var simpleTimer;
let poseNet;
let myPX = 0;
let myPY = 0;

var ImageCan;
var gameIsOver = false;
var spGameOver;
var gameOverSound = false;
var gameIsStart = false;
var gameOverIsFirst = false;

//Control of fruit production at time intervals in milliseconds
var fruitGenerateTimeGap = 120;
//Probability of bomb generation
var grenadeProbability = 0.02;
let song_sword;
let song_gameover;

function preload() {
  img1 = loadImage("1.png");
  img2 = loadImage("2.png");
  img3 = loadImage("3.png");
  img4 = loadImage("4.png");
  img5 = loadImage("5.png");
  img6 = loadImage("b.png");
  swordImage = loadImage("SWORD.png");
  gameOverImage = loadImage("GG.png");
  icomimg = loadImage("bg.png");
  song_gameover = loadSound("GAME OVER.wav");
  song_sword = loadSound("fruit.wav");
}

function setup() {
  createCanvas(canvasWidth, canvasHeight);
  cover();

  //VIDEO  OPAQUE  THRESHOLD
  video = createCapture(VIDEO);
  video.size(canvasWidth, canvasHeight);
  video.hide();

  poseNet = ml5.poseNet(video, modelReady);

  simpleTimer = new Timer(fruitGenerateTimeGap);

  let img1 = loadImage("1.png");
  let img2 = loadImage("2.png");
  let img3 = loadImage("3.png");
  let img4 = loadImage("4.png");
  let img5 = loadImage("5.png");
  let img6 = loadImage("b.png");
  swordImage = loadImage("SWORD.png");

  //creating sword
  sword = createSprite(40, 200, 1, 1);
  sword.addImage(swordImage);
  sword.scale = 0.2;

  //set collider for sword
  sword.setCollider("rectangle", 0, 0, 40, 40);
  sword.immovable = true;
}
function draw() {
  //Dividing the main menu and the game interface into different scenes and switching between them with button control
  if (gameIsStart == true) {
    main();
  } else {
    image(ImageCan, 0, 0);
  }
}

function main() {
  if (gameIsOver) {
    gameOver();
  }
  if (spGameOver) {
    spGameOver.position.x = 400;
    spGameOver.position.y = 300;
  }

  background("lightblue");
  fill(255);
  textSize(55);
  if (video) {
    //Video mirroring
    const flippedVideo = ml5.flipImage(video);
    image(flippedVideo, 0, 0, canvasWidth, canvasHeight);
  }
  //Covering the camera screen with graphics as I do not want the camera screen to appear in the game interface.
  background("lightblue");

  textSize(40);
  fill(0);
  text("SCORE=" + score, 10, 90);
  textSize(20);
  fill(0);
  text("Press shift to return to the main menu ", 10, 120);
  textSize(20);
  fill(0);
  text(
    "Please face your palm towards the camera and use your left hand to control the knife ",
    10,
    40
  );

  //Restrict the position of the knife to within the screen
  xyLimite();
  sword.position.x = flipX(myPX);
  sword.position.y = myPY;

  //Fruits are generated after the game starts
  if (simpleTimer.expired() && gameIsOver != true) {
    createFuits();
    simpleTimer.start();
  }

  if (!gameIsOver) {
    splitFuits();
  }
  drawSprites();
}

function cover() {
  ImageCan = createGraphics(canvasWidth, canvasHeight);
  ImageCan.background(25, 22, 22, 100);
  ImageCan.textSize(30);
  ImageCan.fill("0");
  ImageCan.textAlign(CENTER);
  ImageCan.text("Press the pitcure above to start", 400, 510);
  ImageCan.textSize(30);
  ImageCan.fill("0");
  ImageCan.textAlign(CENTER);
  ImageCan.text("Fruit Ninja webcam ver.", 400, 570);
  ImageCan.textSize(15);
  ImageCan.fill("0");
  ImageCan.textAlign(CENTER);
  ImageCan.text("If you are using a browser to open the game, ", 400, 440);
  ImageCan.textSize(15);
  ImageCan.fill("0");
  ImageCan.textAlign(CENTER);
  ImageCan.text(
    "please resize the browser window to the same size as the game interface to ensure that the game works perfectly.",
    400,
    460
  );

  //Create a graphic button for the main menu screen and overlay a transparent button layer on top of the image to achieve the effect of a button.
  ImageCan.textSize(25);
  ImageCan.image(icomimg, 40, 40, 720, 376);
  ImageCan.btnStart = createButton("gamestart");
  ImageCan.btnStart.position((windowWidth - 720 - 20) / 2, 40);
  ImageCan.btnStart.style("padding-left", "20px");
  ImageCan.btnStart.style("padding-right", "20px");
  ImageCan.btnStart.style("padding-top", "10px");
  ImageCan.btnStart.style("padding-bottom", "10px");
  ImageCan.btnStart.style("font-size", "30px");
  ImageCan.btnStart.style("width", "720px");
  ImageCan.btnStart.style("height", "376px");
  ImageCan.btnStart.style("opacity", "0");
  ImageCan.btnStart.style("image", icomimg);
  ImageCan.btnStart.mouseClicked(startGame);
}

function startGame() {
  gameIsStart = true;
}

function modelReady() {
  poseNet.on("pose", gotPose);
}

function gotPose(poses) {
  //ml5's netpose to recognise the body's limb position and position the prop generation to the wrist to stabilise the knife
  if (poses.length > 0) {
    myPX = poses[0].pose.keypoints[9].position.x;
    myPY = poses[0].pose.keypoints[9].position.y;
  } else {
    myPX = 0;
    myPY = 0;
  }
}

//When the knife collides with the fruit, extra points are scored, and the game ends when it collides with the bomb.
function splitFuits() {
  for (let i = 0; i < allSprites.length; i++) {
    let s = allSprites[i];

    s.addSpeed(0.3, 90);

    if (s.position.y > height + 100) {
      s.remove();
    } else if (s.collide(sword)) {
      if (s.name == "b") {
        s.remove();
        gameIsOver = true;
      } else {
        song_sword.stop();
        song_sword.play();
        s.remove();
        score += 1;
      }
    }
  }
}

//Generate fruit
function createFuits() {
  //if (frameCount % 3== 0) {
  s = createSprite(random(800, -5), 650, 30, 30);
  //r = Math.round(random(1, 6));
  r = getObjectID();
  if (r == 1) {
    s.addImage(img1);
    s.name = "a1";
  } else if (r == 2) {
    s.addImage(img2);
    s.name = "a2";
  } else if (r == 3) {
    s.addImage(img3);
    s.name = "a3";
  } else if (r == 4) {
    s.addImage(img4);
    s.name = "a4";
  } else if (r == 5) {
    s.addImage(img5);
    s.name = "a5";
  } else {
    s.addImage(img6);
    s.name = "b";
  }

  s.velocity.x = random(5, -5);
  s.velocity.y = random(0, -20);
}

//Generate bombs and fruit with a random number of 1-0 and position the random number of bombs generated at 0.02 to determine that fewer bombs are generated than fruit to enhance the game experience.
function getObjectID() {
  n = random(0, 1);

  if (n > 0 && n < grenadeProbability) {
    pr = 6;
  } else {
    pr = Math.round(random(1, 5));
  }
  return pr;
}

function xyLimite() {
  if (myPX > 800) {
    myPx = 800;
  } else if (myPX < 0) {
    myPX = 0;
  }
  if (myPY > 600) {
    myPY = 600;
  } else if (myPY < 0) {
    myPY = 0;
  }
}

function flipX(x) {
  px = abs(x - canvasWidth);
  return px;
}

function gameOver2() {
  sword.position.x = 200;
  sword.position.y = 200;
  song_gameover.play();
}

function gameOver() {
  if (gameOverIsFirst == false) {
    spGameOver = createSprite(40, 200, 1, 1);
    spGameOver.immovable = false;
    spGameOver.addImage(gameOverImage);
    gameOverIsFirst = true;
  }
  //Control the sound to be played only once
  if (gameOverSound == false) {
    song_gameover.play();
    gameOverSound = true;
  }
  myPX = windowWidth / 2 + 215;
  myPY = canvasHeight / 2 - 60;
}

function keyReleased() {
  if (keyCode === SHIFT) {
    score = 0;

    gameIsOver = false;

    gameIsStart = false;
    gameOverIsFirst = false;
    gameOverSound = false;
  }
}
