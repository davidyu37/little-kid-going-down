class Player {
  constructor() {
    const player = game.add.sprite(gameWidth / 2, 50, "player");
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

    this.player = player;
    this.fitness = 0;
    this.vision = []; //the input array fed into the neuralNet
    this.decision = []; //the out put of the NN
    this.unadjustedFitness;
    this.lifespan = 0; //how long the player lived for this.fitness
    this.bestScore = 0; //stores the this.score achieved used for replay
    this.dead = false;
    this.kindaDead = false; //this is true when the player has died but deadcount isn't up
    this.score = 0;
    this.gen = 0;

    this.moveState = 0; // 0 = not moving, 1 = move left, 2 = move right

    // NEAT
    // this.fitness = 0;
    // this.vision = []; //the input array fed into the neuralNet
    // this.decision = []; //the out put of the NN
    // this.unadjustedFitness;
    // this.lifespan = 0; //how long the player lived for this.fitness
    // this.bestScore = 0; //stores the this.score achieved used for replay
    // this.dead = false;
    // this.score = 0;
    // this.gen = 0;

    this.genomeInputs = 5;
    this.genomeOutputs = 3;
    this.brain = new Genome(this.genomeInputs, this.genomeOutputs);
  }

  update() {
    game.physics.arcade.collide(this.player, platforms, this.effect.bind(this));
    game.physics.arcade.collide(this.player, [
      ...leftWalls,
      ...rightWalls,
      ...ceilings,
    ]);

    this.updatePlayer();
    this.checkNailCeiling();
    this.checkFellPlayer();
  }

  normalize(input, base) {
    // Make the number 0 to 1
    let div = input / base;

    if (div > 1) {
      div = 1;
    }

    if (div < -1) {
      div = -1;
    }

    return div;
  }

  look() {
    this.vision = [];
    // Things the AI will "see"
    // player's x position
    // player's y position
    // most bottom platform's x position
    // most bottom platform's y position
    // most bottom platform's x position + platform's width
    let { x: playerX, y: playerY } = this.player;
    const freshPlatform = platforms[platforms.length - 1];

    // If no platform appears yet, use these values
    let platformX = gameWidth / 2,
      platformY = gameHeight,
      platformEnd = platformX + 192;

    if (freshPlatform) {
      const { x, y, width } = freshPlatform;

      platformX = x;
      platformY = y;
      platformEnd = x + width;
    }

    // Normalize data
    platformX = this.normalize(platformX, gameWidth);
    platformY = this.normalize(platformY, gameHeight);
    platformEnd = this.normalize(platformEnd, gameWidth);
    playerX = this.normalize(playerX, gameWidth);
    playerY = this.normalize(playerY, gameHeight);

    this.vision.push(playerX, playerY, platformX, platformY, platformEnd);

    // console.log(this.vision);
  }

  think() {
    this.decision = this.brain.feedForward(this.vision);
    console.log(this.decision);

    let max = 0;
    let maxIndex = 0;

    for (let i = 0; i < this.decision.length; i++) {
      if (this.decision[i] > max) {
        max = this.decision[i];
        maxIndex = i;
      }
    }

    if (max < 0.6) {
      // Stop
      this.stopMoving();
    }

    switch (maxIndex) {
      case 0:
        if (this.moveState == 0) {
          return;
        }
        // Stop Moving
        this.stopMoving();
        this.moveState = 0;
        break;
      case 1:
        if (this.moveState == 1) {
          return;
        }
        this.goLeft();
        this.moveState = 1;
        break;
      case 2:
        if (this.moveState == 2) {
          return;
        }
        this.goRight();
        this.moveState = 2;
        break;
    }

    // Just Move Randomly
    // const rand = Math.random();

    // if (rand < 0.4) {
    //   this.goLeft();
    // }
    // if (rand > 0.6) {
    //   this.goRight();
    // }
  }

  checkNailCeiling() {
    if (this.player.body.y < 35) {
      if (this.player.body.velocity.y < 0) {
        this.player.body.velocity.y = 0;
      }

      if (game.time.now > this.player.unbeatableTime) {
        stabbedSound.play();
        this.player.life -= 3;
        game.camera.flash(0xff0000, 100);
        this.player.unbeatableTime = game.time.now + 1000;
        if (this.player.life <= 0 && !this.dead) {
          stabbedScream.play();
          this.dead = true;
        }
      }
    }
  }

  checkFellPlayer() {
    if (this.player.body.y > gameHeight + 100 && !this.dead) {
      fallSound.play();
      console.log("fell to death");
      this.dead = true;

      // gameOver();
    }
  }

  stopMoving() {
    this.player.body.velocity.x = 0;
  }

  goLeft() {
    this.player.body.velocity.x = -250;
  }

  goRight() {
    this.player.body.velocity.x = 250;
  }

  updatePlayer() {
    this.setPlayerAnimate(this.player);
  }

  setPlayerAnimate(player) {
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

  conveyorRightEffect(player, platform) {
    if (player.touchOn !== platform) {
      if (!conveyorSound.isPlaying) {
        conveyorSound.play();
      }
      player.touchOn = platform;
    }
    player.body.x += 2;
  }

  conveyorLeftEffect(player, platform) {
    if (player.touchOn !== platform) {
      conveyorSound.play();
      player.touchOn = platform;
    }
    player.body.x -= 2;
  }

  trampolineEffect(player, platform) {
    if (player.body.y > platform.body.y) return;
    if (!springSound.isPlaying) {
      springSound.play();
    }

    platform.animations.play("jump");
    player.body.velocity.y = -350;
  }

  nailsEffect(player, platform) {
    // So player doesn't get stabbed from the side
    if (player.body.y > platform.body.y) return;
    if (player.touchOn !== platform) {
      if (!stabbedSound.isPlaying) {
        stabbedSound.play();
      }
      player.life -= 3;
      player.touchOn = platform;
      game.camera.flash(0xff0000, 100);
      if (player.life <= 0 && !this.dead) {
        stabbedScream.play();
        this.dead = true;
      }
    }
  }

  basicEffect(player, platform) {
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

  fakeEffect(player, platform) {
    if (player.body.y > platform.body.y) return;
    if (player.touchOn !== platform) {
      if (!spinSound.isPlaying) {
        spinSound.play();
      }
      platform.animations.play("turn");
      setTimeout(function () {
        platform.body.checkCollision.up = false;
        setTimeout(() => {
          platform.body.checkCollision.up = true;
        }, 1000);
      }, 100);
      player.touchOn = platform;
    }
  }

  // Effects
  effect(player, platform) {
    if (platform.key == "conveyorRight") {
      this.conveyorRightEffect(player, platform);
    }
    if (platform.key == "conveyorLeft") {
      this.conveyorLeftEffect(player, platform);
    }
    if (platform.key == "trampoline") {
      this.trampolineEffect(player, platform);
    }
    if (platform.key == "nails") {
      this.nailsEffect(player, platform);
    }
    if (platform.key == "normal") {
      this.basicEffect(player, platform);
    }
    if (platform.key == "fake") {
      this.fakeEffect(player, platform);
    }
  }
}
