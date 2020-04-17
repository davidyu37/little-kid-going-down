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

    // this.genomeInputs = 4;
    // this.genomeOutputs = 1;
    // this.brain = new Genome(this.genomeInputs, this.genomeOutputs);
  }

  update() {
    game.physics.arcade.collide(this.player, platforms, effect);
    game.physics.arcade.collide(this.player, [
      ...leftWalls,
      ...rightWalls,
      ...ceilings,
    ]);

    this.updatePlayer();
    this.checkTouchCeiling();
    this.checkGameOver();

    const rand = Math.random();

    if (rand < 0.4) {
      this.goLeft();
    }
    if (rand > 0.6) {
      this.goRight();
    }
  }

  look() {}

  think() {}

  checkTouchCeiling() {
    if (this.player.body.y < 35) {
      if (this.player.body.velocity.y < 0) {
        this.player.body.velocity.y = 0;
      }

      if (game.time.now > this.player.unbeatableTime) {
        stabbedSound.play();
        this.player.life -= 3;
        game.camera.flash(0xff0000, 100);
        this.player.unbeatableTime = game.time.now + 1000;
        if (this.player.life <= 0) {
          if (!stabbedScream.isPlaying) {
            stabbedScream.play();
            // isStabbedToDeath = true;
            // this.player.animations.stop();
            // this.player.body.gravity.y = 0;
            // setTimeout(gameOver, 1000);
          }
        }
      }
    }
  }

  checkGameOver() {
    if (this.player.body.y > gameHeight + 100) {
      // fallSound.play();
      this.dead = true;

      // gameOver();
    }
  }

  goLeft() {
    this.player.body.velocity.x = -250;
  }

  goRight() {
    this.player.body.velocity.x = 250;
  }

  updatePlayer() {
    setPlayerAnimate(this.player);
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
}
