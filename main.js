const gameWidth = 800;
const gameHeight = 800;
const scale = 2;

var game = new Phaser.Game(gameWidth, gameHeight, Phaser.AUTO, "", {
  preload: preload,
  create: create,
  update: update,
});

var player;
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
  createPlayer();
  createTextsBoard();
  addAudio();
}

function update() {
  // bad
  if (status == "gameOver" && keyboard.enter.isDown) restart();
  if (status != "running") return;
  if (isStabbedToDeath) return;

  this.physics.arcade.collide(player, platforms, effect);
  this.physics.arcade.collide(player, [
    ...leftWalls,
    ...rightWalls,
    ...ceilings,
  ]);
  checkTouchCeiling(player);
  checkGameOver();

  updatePlayer();
  updatePlatforms();
  updateTextsBoard();

  createPlatforms();
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

  const ceilingWidth = 400;
  const numberOfCeilings = Math.round(gameWidth / ceilingWidth);

  for (let index = 0; index < numberOfCeilings; index++) {
    let ceiling = game.add.sprite(ceilingWidth * index, 0, "ceiling");
    ceiling.scale.setTo(scale, scale);
    game.physics.arcade.enable(ceiling);
    ceiling.body.immovable = true;
    ceilings.push(ceiling);
  }
}

var lastTime = 0;
function createPlatforms() {
  if (game.time.now > lastTime + 1000) {
    lastTime = game.time.now;
    createOnePlatform();
    distance += 1;
  }
}

function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
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

  // Assign uuid to each platform
  platform.uuid = uuidv4();

  platforms.push(platform);
}

function createPlayer() {
  player = game.add.sprite(gameWidth / 2, 50, "player");
  player.scale.setTo(scale, scale);
  player.direction = 10;
  game.physics.arcade.enable(player);
  player.body.gravity.y = 800;
  player.animations.add("left", [0, 1, 2, 3], 8);
  player.animations.add("right", [9, 10, 11, 12], 8);
  player.animations.add("flyleft", [18, 19, 20, 21], 12);
  player.animations.add("flyright", [27, 28, 29, 30], 12);
  player.animations.add("fly", [36, 37, 38, 39], 12);
  player.life = 10;
  player.unbeatableTime = 0;
  player.touchOn = undefined;
}

function createTextsBoard() {
  var style = { fill: "#ff0000", fontSize: "20px" };
  text1 = game.add.text(10, 10, "", style);
  text2 = game.add.text(gameWidth - 50, 10, "", style);
  text3 = game.add.text(
    gameWidth / 2 - 60,
    gameHeight / 2,
    "Enter 重新開始",
    style
  );
  text3.visible = false;
}

function updatePlayer() {
  if (keyboard.left.isDown) {
    player.body.velocity.x = -250;
  } else if (keyboard.right.isDown) {
    player.body.velocity.x = 250;
  } else {
    player.body.velocity.x = 0;
  }
  setPlayerAnimate(player);
}

function setPlayerAnimate(player) {
  var x = player.body.velocity.x;
  var y = player.body.velocity.y;

  if (x < 0 && y > 0) {
    player.animations.play("flyleft");
  }
  if (x > 0 && y > 0) {
    player.animations.play("flyright");
  }
  if (x < 0 && y == 0) {
    player.animations.play("left");
  }
  if (x > 0 && y == 0) {
    player.animations.play("right");
  }
  if (x == 0 && y != 0) {
    player.animations.play("fly");
  }
  if (x == 0 && y == 0) {
    player.frame = 8;
  }
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

function updateTextsBoard() {
  text1.setText("life:" + player.life);
  text2.setText("B" + distance);
}

function effect(player, platform) {
  if (platform.key == "conveyorRight") {
    conveyorRightEffect(player, platform);
  }
  if (platform.key == "conveyorLeft") {
    conveyorLeftEffect(player, platform);
  }
  if (platform.key == "trampoline") {
    trampolineEffect(player, platform);
  }
  if (platform.key == "nails") {
    nailsEffect(player, platform);
  }
  if (platform.key == "normal") {
    basicEffect(player, platform);
  }
  if (platform.key == "fake") {
    fakeEffect(player, platform);
  }
  currentPlatform = platform.uuid;
}

function conveyorRightEffect(player, platform) {
  if (player.touchOn !== platform) {
    if (!conveyorSound.isPlaying) {
      conveyorSound.play();
    }
    player.touchOn = platform;
  }
  player.body.x += 2;
}

function conveyorLeftEffect(player, platform) {
  if (player.touchOn !== platform) {
    conveyorSound.play();
    player.touchOn = platform;
  }
  player.body.x -= 2;
}

function trampolineEffect(player, platform) {
  if (player.body.y > platform.body.y) return;
  if (!springSound.isPlaying) {
    springSound.play();
  }

  platform.animations.play("jump");
  player.body.velocity.y = -350;
}

function nailsEffect(player, platform) {
  if (player.touchOn !== platform) {
    if (!stabbedSound.isPlaying) {
      stabbedSound.play();
    }
    player.life -= 3;
    player.touchOn = platform;
    game.camera.flash(0xff0000, 100);
    if (player.life <= 0) {
      if (!stabbedScream.isPlaying) {
        stabbedScream.play();
        isStabbedToDeath = true;
        player.animations.stop();
        player.body.gravity.y = 0;
        setTimeout(gameOver, 1000);
      }
    }
  }
}

function basicEffect(player, platform) {
  if (player.touchOn !== platform) {
    if (!platformSound.isPlaying) {
      platformSound.play();
    }
    if (player.life < 10) {
      player.life += 1;
    }
    player.touchOn = platform;
  }
}

function fakeEffect(player, platform) {
  if (player.body.y > platform.body.y) return;
  if (player.touchOn !== platform) {
    if (!spinSound.isPlaying) {
      spinSound.play();
    }
    platform.animations.play("turn");
    setTimeout(function () {
      platform.body.checkCollision.up = false;
    }, 100);
    player.touchOn = platform;
  }
}

function checkTouchCeiling(player) {
  if (player.body.y < 35) {
    if (player.body.velocity.y < 0) {
      player.body.velocity.y = 0;
    }

    if (game.time.now > player.unbeatableTime) {
      stabbedSound.play();
      player.life -= 3;
      game.camera.flash(0xff0000, 100);
      player.unbeatableTime = game.time.now + 1000;
      if (player.life <= 0) {
        if (!stabbedScream.isPlaying) {
          stabbedScream.play();
          isStabbedToDeath = true;
          player.animations.stop();
          player.body.gravity.y = 0;
          setTimeout(gameOver, 1000);
        }
      }
    }
  }
}

function checkGameOver() {
  if (player.body.y > gameHeight + 100) {
    fallSound.play();
    gameOver();
  }
  //   if (player.life <= 0 || player.body.y > gameHeight + 100) {
  //   }
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
  createPlayer();
  status = "running";
}
