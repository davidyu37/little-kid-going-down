let showBest = true;

class Population {
  constructor(size) {
    this.players = [];
    this.bestPlayer;
    this.bestFitness = 0;
    this.generation = 0;
    this.matingPool = [];

    for (let i = 0; i < size; i++) {
      this.players.push(new Player(FamilyNames[i], this.generation));
      this.players[i].brain.generateNetwork();
      this.players[i].brain.mutate();
    }
  }

  update() {
    this.updateAlive();
  }

  updateAlive() {
    for (let i = 0; i < this.players.length; i++) {
      if (!this.players[i].dead) {
        this.players[i].look();
        this.players[i].think();
        this.players[i].update();
      }
    }

    // if (showBest && this.bestPlayer && !this.bestPlayer.dead) {
    //   this.bestPlayer.look();
    //   this.bestPlayer.think();
    //   this.bestPlayer.update();
    // }
  }

  done() {
    for (let i = 0; i < this.players.length; i++) {
      if (!this.players[i].dead) {
        return false;
      }
    }

    return true;
  }

  naturalSelection() {
    this.calculateFitness();
    let averageSum = this.getAverageScore();
    let children = [];

    this.fillMatingPool();
    for (let i = 0; i < this.players.length; i++) {
      let parent1 = this.selectPlayer();
      let parent2 = this.selectPlayer();
      if (parent1.fitness > parent2.fitness)
        children.push(parent1.crossover(parent2));
      else children.push(parent2.crossover(parent1));
    }

    this.players.forEach((element) => {
      element.destroy();
    });

    this.players.splice(0, this.players.length);
    this.players = children.slice(0);
    this.generation++;
    this.players.forEach((element) => {
      element.brain.generateNetwork();
    });

    console.log("Generation " + this.generation);

    generation.innerHTML = this.generation;

    this.bestPlayer.lifespan = 0;
    this.bestPlayer.dead = false;
    this.bestPlayer.score = 1;
  }

  calculateFitness() {
    let currentMax = 0;
    this.players.forEach((element) => {
      element.calculateFitness();
      if (element.fitness > this.bestFitness) {
        this.bestFitness = element.fitness;
        this.bestPlayer = element.clone();
        this.bestPlayer.brain.id = "BestGenome";

        // console.log("best player", this.bestPlayer);
        // this.bestPlayer.brain.draw();
      }

      if (element.fitness > currentMax) currentMax = element.fitness;
    });

    //Normalize
    this.players.forEach((element, elementN) => {
      element.fitness /= currentMax;
    });
  }

  fillMatingPool() {
    this.matingPool.splice(0, this.matingPool.length);
    this.players.forEach((element, elementN) => {
      let n = element.fitness * 100;
      for (let i = 0; i < n; i++) this.matingPool.push(elementN);
    });
  }

  selectPlayer() {
    let rand = Math.floor(Math.random() * this.matingPool.length);
    return this.players[this.matingPool[rand]];
  }

  getAverageScore() {
    let avSum = 0;
    this.players.forEach((element) => {
      avSum += element.score;
    });

    return avSum / this.players.length;
  }

  done() {
    for (var i = 0; i < this.players.length; i++) {
      if (!this.players[i].dead) {
        return false;
      }
    }

    return true;
  }
}
