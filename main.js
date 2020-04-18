const gameWidth = 800;
const gameHeight = 800;
const scale = 2;

var game = new Phaser.Game(gameWidth, gameHeight, Phaser.AUTO, "", {
  preload: preload,
  create: create,
  update: update,
});

// var player;
var keyboard;

var platforms = [];

var leftWalls = [];
var rightWalls = [];
var ceilings = [];

var text1;
var text2;
var text3;

var distance = 0;
var status = "running";

// Current Platform to keep track of the platform
let currentPlatform;

// Sounds
let conveyorSound,
  springSound,
  fallSound,
  platformSound,
  spinSound,
  stabbedSound,
  stabbedScream;

let isStabbedToDeath = false;

// Genetic Algothrithm Stuff
let population;
let nextConnectionNo = 1000;

// Scoreboard elements
const lifeBar = document.getElementById("life-bar");
const score = document.getElementById("score");

function preload() {
  game.load.baseURL = "./assets/";
  game.load.crossOrigin = "anonymous";
  game.load.spritesheet("player", "player.png", 32, 32);
  game.load.image("wall", "wall.png");
  game.load.image("ceiling", "ceiling.png");
  game.load.image("normal", "normal.png");
  game.load.image("nails", "nails.png");
  game.load.spritesheet("conveyorRight", "conveyor_right.png", 96, 16);
  game.load.spritesheet("conveyorLeft", "conveyor_left.png", 96, 16);
  game.load.spritesheet("trampoline", "trampoline.png", 96, 22);
  game.load.spritesheet("fake", "fake.png", 96, 36);
  game.load.audio("conveyor", "/sounds/Conveyor 1.mp3");
  game.load.audio("spring", "/sounds/Spring 1.mp3");
  game.load.audio("fall", "/sounds/Fall 2.mp3");
  game.load.audio("platform", "/sounds/Platform 2.mp3");
  game.load.audio("spin", "/sounds/Spin 2.mp3");
  game.load.audio("stabbed", "/sounds/Stabbed.mp3");
  game.load.audio("stabbedScream", "/sounds/Stabbed Scream.mp3");
}

function create() {
  keyboard = game.input.keyboard.addKeys({
    enter: Phaser.Keyboard.ENTER,
    up: Phaser.Keyboard.UP,
    down: Phaser.Keyboard.DOWN,
    left: Phaser.Keyboard.LEFT,
    right: Phaser.Keyboard.RIGHT,
    w: Phaser.Keyboard.W,
    a: Phaser.Keyboard.A,
    s: Phaser.Keyboard.S,
    d: Phaser.Keyboard.D,
  });

  createBounders();
  addAudio();

  // Create population
  population = new Population(10);

  // createPlayer();
  // createTextsBoard();

  // Mute the screaming kids
  game.sound.mute = true;
}

function update() {
  // bad
  if (status == "gameOver" && keyboard.enter.isDown) restart();
  if (status != "running") return;
  if (isStabbedToDeath) return;

  population.update();

  updatePlatforms();

  createPlatforms();
}

function updateLifeBar() {
  if (player.life <= 0) {
    const boxes = Array.from(lifeBar.children);
    boxes.forEach((elem) => {
      elem.className = "life-empy";
    });
    return;
  }
  const currentLife = player.life;
  const boxes = Array.from(lifeBar.children);

  const actives = boxes.slice(0, currentLife);
  const empties = boxes.slice(currentLife, boxes.length);

  actives.forEach((elem) => {
    elem.className = "life-active";
  });

  empties.forEach((elem) => {
    elem.className = "life-empy";
  });
}

function addAudio() {
  conveyorSound = game.add.audio("conveyor");
  springSound = game.add.audio("spring");
  fallSound = game.add.audio("fall");
  platformSound = game.add.audio("platform");
  spinSound = game.add.audio("spin");
  stabbedSound = game.add.audio("stabbed");
  stabbedScream = game.add.audio("stabbedScream");
}

function createBounders() {
  const ceilingWidth = 400;
  const numberOfCeilings = Math.round(gameWidth / ceilingWidth);

  for (let index = 0; index < numberOfCeilings; index++) {
    let ceiling = game.add.sprite(ceilingWidth * index, 0, "ceiling");
    ceiling.scale.setTo(scale, scale);
    game.physics.arcade.enable(ceiling);
    ceiling.body.immovable = true;
    ceilings.push(ceiling);
  }

  const wallHeight = 400;
  const numberOfWalls = Math.round(gameHeight / 400);
  for (let index = 0; index < numberOfWalls; index++) {
    let leftWall = game.add.sprite(0, wallHeight * index, "wall");
    game.physics.arcade.enable(leftWall);
    leftWall.body.immovable = true;

    leftWalls.push(leftWall);

    let rightWall = game.add.sprite(gameWidth - 17, wallHeight * index, "wall");
    game.physics.arcade.enable(rightWall);
    rightWall.body.immovable = true;

    rightWalls.push(rightWall);
  }
}

var lastTime = 0;
function createPlatforms() {
  if (game.time.now > lastTime + 1000) {
    lastTime = game.time.now;
    createOnePlatform();
    distance += 1;
    score.innerHTML = distance;
  }
}

function createOnePlatform() {
  var platform;
  var x = Math.random() * (gameWidth - 96 * scale - 40 * scale) + 20 * scale;
  var y = gameHeight;
  var rand = Math.random() * 100;

  let platformType = "normal";

  if (rand < 20) {
    platform = game.add.sprite(x, y, "normal");
  } else if (rand < 40) {
    platform = game.add.sprite(x, y, "nails");
    platformType = "nails";
    game.physics.arcade.enable(platform);
    platform.body.setSize(96, 15, 0, 15);
  } else if (rand < 50) {
    platform = game.add.sprite(x, y, "conveyorLeft");
    platformType = "conveyorLeft";
    platform.animations.add("scroll", [0, 1, 2, 3], 16, true);
    platform.play("scroll");
  } else if (rand < 60) {
    platform = game.add.sprite(x, y, "conveyorRight");
    platformType = "conveyorRight";
    platform.animations.add("scroll", [0, 1, 2, 3], 16, true);
    platform.play("scroll");
  } else if (rand < 80) {
    platform = game.add.sprite(x, y, "trampoline");
    platformType = "trampoline";
    platform.animations.add("jump", [4, 5, 4, 3, 2, 1, 0, 1, 2, 3], 120);
    platform.frame = 3;
  } else {
    platform = game.add.sprite(x, y, "fake");
    platformType = "fake";
    platform.animations.add("turn", [0, 1, 2, 3, 4, 5, 0], 14);
  }

  platform.scale.setTo(scale, scale);
  game.physics.arcade.enable(platform);
  platform.body.immovable = true;

  // Offset collison box by 6 of y to actually touch the platform
  if (platformType === "trampoline") {
    platform.body.setSize(96, 22, 0, 6);
  }

  if (platformType === "fake") {
    platform.body.setSize(96, 22, 0, 10);
  }

  platform.body.checkCollision.down = false;
  platform.body.checkCollision.left = false;
  platform.body.checkCollision.right = false;

  platforms.push(platform);
}

function createTextsBoard() {
  var style = { fill: "#ff0000", fontSize: "20px" };
  text3 = game.add.text(
    gameWidth / 2 - 60,
    gameHeight / 2,
    "Enter 重新開始",
    style
  );
  text3.visible = false;
}

function updatePlatforms() {
  for (var i = 0; i < platforms.length; i++) {
    var platform = platforms[i];
    platform.body.position.y -= 2;
    if (platform.body.position.y <= -32) {
      platform.destroy();
      platforms.splice(i, 1);
    }
  }
}

function gameOver() {
  text3.visible = true;
  isStabbedToDeath = false;
  platforms.forEach(function (s) {
    s.destroy();
  });
  platforms = [];
  status = "gameOver";
}

function restart() {
  text3.visible = false;
  if (player) {
    player.destroy();
  }
  distance = 0;
  // createPlayer();
  status = "running";
}
