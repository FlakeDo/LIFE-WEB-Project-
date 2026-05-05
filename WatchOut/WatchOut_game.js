// Constantes

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const GAME_SPEED_START = 1; // 1.0
const GAME_SPEED_INCREMENT = 0.00001; // + 0

const GAME_WIDTH = 800;
const GAME_HEIGHT = 200;
const PLAYER_WIDTH = 88 / 1.5; //58
const PLAYER_HEIGHT = 94 / 1.5; //62
const BIRD_SPEED = 0.5;


// Objets

let player = null;
let birdsController = null;
let score = null;

let scaleRatio = null;
let previousTime = null;
let gameSpeed = GAME_SPEED_START;
let hasAddedEventListenersForRestart = false;
let gameOver = false;
let waitingToStart = true;


// JOUEUR ===================================================================

class Player {

  countdown = 0;
  is_switching = false;
  switchInProgress = false;
  switchDir = 0;

  constructor(ctx, width, height, scaleRatio) {
    this.ctx = ctx;
    this.canvas = ctx.canvas;
    this.width = width;
    this.height = height;
    this.scaleRatio = scaleRatio;
    this.offset = height /2

    this.lanes = [this.canvas.height / 4 - this.offset, this.canvas.height / 2 - this.offset, this.canvas.height * 3 / 4 - this.offset];
    this.currentLane = 1;
    this.switchSpeed = 1;

    this.x = 10 * scaleRatio;
    this.y = this.lanes[this.currentLane];
    this.yStandingPosition = this.y;

    this.playerSprite = null;
    const img = new Image();
    img.onload = () => this.playerSprite = img;
    img.src = "images/player.png";

    //keyboard
    window.removeEventListener("keydown", this.keydown);

    window.addEventListener("keydown", (event) => this.keydown(event));
  }

  keydown = (event) => {
    const keyName = event.key;

    if (keyName === "z" || keyName === "s") {
    event.preventDefault(); // Empêche le défilement de la page pour 'z' et 's'
    if (keyName === "z" && this.currentLane > 0) {
      this.switchDir = -1;
      this.currentLane -= 1;
      this.is_switching = true;
    }
    if (keyName === "s" && this.currentLane < 2) {
      this.switchDir = 1;
      this.currentLane += 1;
      this.is_switching = true;
    }
  }
  };


  update(frameTimeDelta) {
    this.switch_lane(frameTimeDelta);
  }

  switch_lane(frameTimeDelta) {
    if (this.is_switching) {
      this.switchInProgress = true;
      this.is_switching= false;
    }

    if (this.switchInProgress) {
      
      this.y += this.switchDir * this.switchSpeed * frameTimeDelta * this.scaleRatio;

       if (
        (this.switchDir < 0 && this.y <= this.lanes[this.currentLane]) ||
        (this.switchDir > 0 && this.y >= this.lanes[this.currentLane])
      ) {
        this.y = this.lanes[this.currentLane];
        this.switchInProgress = false;
      }
      
    } 
  }

  draw() {
  if (!this.playerSprite) return;
  this.ctx.drawImage(this.playerSprite, this.x, this.y, this.width, this.height);
}
}


// OISEAUX =============================================================================

class Bird {

  constructor(ctx, x, y, birdLane) {
    this.ctx = ctx;
    this.canvas = ctx.canvas;
    this.width = 194 / 1.5;
    this.height = 127 / 1.5;
    this.x = x;
    this.y = y;
    this.lane = birdLane;

    this.birdImage = null;
    const img = new Image();
    img.onload = () => this.birdImage = img;
    img.src = "images/dino_volant.png";
  }

  update(speed, gameSpeed, frameTimeDelta, scaleRatio) {
    this.x -= speed * gameSpeed * frameTimeDelta * scaleRatio;
  }

  draw() {
    if (!this.birdImage) return;
    this.ctx.drawImage(this.birdImage, this.x, this.y, this.width, this.height);
  }

  collideWith(sprite) {
    const adjustBy = 1.4;
    if (
      sprite.x < this.x + this.width / adjustBy &&
      sprite.x + sprite.width / adjustBy > this.x &&
      sprite.currentLane === this.lane
    ) {
      return true;
    } else {
      return false;
    }
  }
}


// GESTION DES OISEAUX =================================================================

class BirdsController {
  BIRD_INTERVAL_MIN = 500;
  BIRD_INTERVAL_MAX = 2000;

  nextBirdInterval = null;
  birds = [];

  constructor(ctx, scaleRatio, speed) {
    this.ctx = ctx;
    this.canvas = ctx.canvas;
    this.scaleRatio = scaleRatio;
    this.speed = speed;

    
    this.offset = (127 / 1.5) /2;

    this.lanes = [this.canvas.height / 4 - this.offset, this.canvas.height / 2 - this.offset, this.canvas.height * 3 / 4 - this.offset];

    this.setNextBirdTime();
  }

  setNextBirdTime() {
    const num = this.getRandomNumber(
      this.BIRD_INTERVAL_MIN,
      this.BIRD_INTERVAL_MAX
    );

    this.nextBirdInterval = num;
  }

  getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  createBird() {
    const birdLane = this.getRandomNumber(0, 2);
    const x = this.canvas.width * 1.5;
    const y = this.lanes[birdLane];
    const bird = new Bird(
      this.ctx,
      x,
      y,
      birdLane
    );

    this.birds.push(bird);
  }

  update(gameSpeed, frameTimeDelta) {
    if (this.nextBirdInterval <= 0) {
      this.createBird();
      this.setNextBirdTime();
    }
    this.nextBirdInterval -= frameTimeDelta;

    this.birds.forEach((bird) => {
      bird.update(this.speed, gameSpeed, frameTimeDelta, this.scaleRatio);
    });

    this.birds = this.birds.filter((bird) => bird.x > -bird.width);
  }

  draw() {
    this.birds.forEach((bird) => bird.draw());
  }

  collideWith(sprite) {
    return this.birds.some((bird) => bird.collideWith(sprite));
  }

  reset() {
    this.birds = [];
  }
}


// SCORE ====================================================================

class Score {
  score = 0;
  HIGH_SCORE_KEY = "highScore";
  birdPenalty = 10;

  constructor(ctx, scaleRatio) {
    this.ctx = ctx;
    this.canvas = ctx.canvas;
    this.scaleRatio = scaleRatio;
  }

  update(frameTimeDelta) {
    this.score += frameTimeDelta * 0.01;
  }

  reset() {
    this.score = 0;
  }

  setHighScore() {
    const highScore = Number(localStorage.getItem(this.HIGH_SCORE_KEY));
    if (this.score > highScore) {
      localStorage.setItem(this.HIGH_SCORE_KEY, Math.floor(this.score));
    }
  }

  draw() {
    const highScore = Number(localStorage.getItem(this.HIGH_SCORE_KEY));
    const y = 20 * this.scaleRatio;

    const fontSize = 20 * this.scaleRatio;
    this.ctx.font = `${fontSize}px serif`;
    this.ctx.fillStyle = "#525250";
    const scoreX = this.canvas.width - 75 * this.scaleRatio;
    const highScoreX = scoreX - 125 * this.scaleRatio;

    const scorePadded = Math.floor(this.score).toString().padStart(6, 0);
    const highScorePadded = highScore.toString().padStart(6, 0);

    this.ctx.fillText(scorePadded, scoreX, y);
    this.ctx.fillText(`HI ${highScorePadded}`, highScoreX, y);
  }
}




// DÉROULEMENT DU JEU ===============================================================

function setupGameReset() {
  if (!hasAddedEventListenersForRestart) {
    hasAddedEventListenersForRestart = true;

    setTimeout(() => {
      window.addEventListener("keyup", reset, { once: true });
    }, 100);
  }
}


function reset() {
  hasAddedEventListenersForRestart = false;
  gameOver = false;
  waitingToStart = false;
  birdsController.reset();
  score.reset();
  gameSpeed = GAME_SPEED_START;
}


function createSprites() {
  const playerWidthInGame = PLAYER_WIDTH * scaleRatio;
  const playerHeightInGame = PLAYER_HEIGHT * scaleRatio;

  player = new Player(
    ctx,
    playerWidthInGame,
    playerHeightInGame,
    scaleRatio
  );

  birdsController = new BirdsController(
    ctx,
    scaleRatio,
    BIRD_SPEED
  );

  score = new Score(ctx, scaleRatio);
}

function setScreen() {
  scaleRatio = getScaleRatio();

  // Garantit une taille minimale si le ratio est nul ou trop petit
  if (!scaleRatio || scaleRatio <= 0) scaleRatio = 1;

  canvas.width = GAME_WIDTH * scaleRatio;
  canvas.height = GAME_HEIGHT * scaleRatio;
  createSprites();
}

setScreen();
console.log("scaleRatio:", scaleRatio);
console.log("canvas size:", canvas.width, canvas.height);

function getScaleRatio() {
  const screenHeight = Math.min(window.innerHeight, document.documentElement.clientHeight);
  const screenWidth  = Math.min(window.innerWidth,  document.documentElement.clientWidth);

  // On prend le ratio le plus petit pour que le canvas tienne dans les deux dimensions
  return Math.min(screenWidth / GAME_WIDTH, screenHeight / GAME_HEIGHT);
}

function showGameOver() {
  const fontSize = 70 * scaleRatio;
  ctx.font = `${fontSize}px Verdana`;
  ctx.fillStyle = "grey";
  const x = canvas.width / 4.5;
  const y = canvas.height / 2;
  ctx.fillText("GAME OVER", x, y);
}

function showStartGameText() {
  const fontSizeBig = 30 * scaleRatio;
  ctx.font = `${fontSizeBig}px Verdana`;
  ctx.fillStyle = "grey";
  const x = canvas.width / 4;
  const y = canvas.height / 2;
  ctx.fillText("Esquivez un maximum d'oiseaux !", x-140, y - 10);
  ctx.fillText("Appuyez sur espace pour commencer", x-140, y + 60);

  const fontSizeSmall = 20 * scaleRatio;
  ctx.font = `${fontSizeSmall}px Verdana`;
  ctx.fillText("Déplacez-vous vers le haut et vers le bas avec les touches Z et S", x-140, y +120);
  
}

function updateGameSpeed(frameTimeDelta) {
  gameSpeed += frameTimeDelta * GAME_SPEED_INCREMENT;
}

function clearScreen() {
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function gameLoop(currentTime) {
  if (previousTime === null) {
    previousTime = currentTime;
    requestAnimationFrame(gameLoop);
    return;
  }
  const frameTimeDelta = currentTime - previousTime;
  previousTime = currentTime;

  clearScreen();

  if (waitingToStart) {
    showStartGameText();
  }

  if (!gameOver && !waitingToStart) {
    //Update game objects
    birdsController.update(gameSpeed, frameTimeDelta);
    player.update(frameTimeDelta);
    score.update(frameTimeDelta);
    updateGameSpeed(frameTimeDelta);
  }

  if (!gameOver && birdsController.collideWith(player)) {
    gameOver = true;
    setupGameReset();
    score.setHighScore();
  }

  //Draw game objects
  birdsController.draw();
  player.draw();
  score.draw();

  if (gameOver) {
    showGameOver();
  }

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);

window.addEventListener("keyup", reset, { once: true });