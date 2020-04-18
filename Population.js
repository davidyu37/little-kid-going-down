class Population {
  constructor(size) {
    this.players = [];
    this.bestPlayer;
    this.bestScore = 0;
    this.gen = 1;
    this.innovationHistory = [];
    this.genPlayers = [];
    this.species = [];
    this.massExtinctionEvent = false;
    this.newStage = false;

    this.gensSinceNewWorld = 0;

    for (var i = 0; i < size; i++) {
      this.players.push(new Player());
      this.players[this.players.length - 1].brain.fullyConnect(
        this.innovationHistory
      );
      this.players[this.players.length - 1].brain.generateNetwork();
    }
  }

  update() {
    // for (var i = 0; i < this.players.length; i++) {
    //   this.players[i].update();
    // }
    this.updateAlive();
  }

  updateAlive() {
    let aliveCount = 0;
    for (var i = 0; i < this.players.length; i++) {
      if (!this.players[i].dead) {
        aliveCount++;
        this.players[i].look(); //get inputs for brain
        this.players[i].think(); //use outputs from neural network
        this.players[i].update(); //move the player according to the outputs from the neural network
      }
    }

    if (aliveCount == 0) {
      this.batchNo++;
    }
  }

  playerInBatch(player) {
    for (
      var i = this.batchNo * this.worldsPerBatch;
      i < Math.min((this.batchNo + 1) * this.worldsPerBatch, worlds.length);
      i++
    ) {
      if (player.world == worlds[i]) {
        return true;
      }
    }

    return false;
  }

  //-----------------------------------------------------------------------------------------------------------------------------------
  //calculate all the fitnesses
  calculateFitness() {
    for (var i = 0; i < this.players.length; i++) {
      this.players[i].calculateFitness();
    }
  }

  //------------------------------------------------------------------------------------------------------------------------------------
  //returns whether all the players are either dead or have reached the goal
  allPlayersDead() {
    for (var i = 0; i < this.players.length; i++) {
      if (!this.players[i].dead && !this.players[i].reachedGoal) {
        return false;
      }
    }
    print("bah:");
    return true;
  }

  done() {
    for (var i = 0; i < this.players.length; i++) {
      if (!this.players[i].dead) {
        return false;
      }
    }

    return true;
  }

  naturalSelection() {
    // this.calculateFitness();
    // console.log("natural selection");
    // this.setBestPlayer();
    // console.log("The best player", this.players[this.bestPlayer]);

    var previousBest = this.players[0];
    this.speciate(); //seperate the this.players varo this.species
    console.log("species", this.species);
    this.calculateFitness(); //calculate the fitness of each player
    // this.sortSpecies(); //sort the this.species to be ranked in fitness order, best first
    if (this.massExtinctionEvent) {
      this.massExtinction();
      this.massExtinctionEvent = false;
    }
    // this.cullSpecies(); //kill off the bottom half of each this.species
    this.setBestPlayer(); //save the best player of thisthis.gen
    // this.killStaleSpecies(); //remove this.species which haven't improved in the last 15(ish)this.generations
    // this.killBadSpecies(); //kill this.species which are so bad that they cant reproduce

    console.log(
      "generation  " +
        this.gen +
        "  Number of mutations  " +
        this.innovationHistory.length +
        "  species:   " +
        this.species.length +
        "  <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<"
    );

    var averageSum = this.getAvgFitnessSum();
    var children = [];
    for (var j = 0; j < this.species.length; j++) {
      //for each this.species

      children.push(this.species[j].champ.clone()); //add champion without any mutation
      var NoOfChildren =
        floor(
          (this.species[j].averageFitness / averageSum) * this.players.length
        ) - 1; //the number of children this this.species is allowed, note -1 is because the champ is already added

      for (var i = 0; i < NoOfChildren; i++) {
        //get the calculated amount of children from this this.species
        children.push(this.species[j].giveMeBaby(this.innovationHistory));
      }
    }
    // setup();
    // return;
    if (children.length < this.players.length) {
      children.push(previousBest.clone());
    }
    while (children.length < this.players.length) {
      //if not enough babies (due to flooring the number of children to get a whole var)
      children.push(this.species[0].giveMeBaby(this.innovationHistory)); //get babies from the best this.species
    }

    this.players = [];
    arrayCopy(children, this.players); //set the children as the current this.playersulation
    this.gen += 1;
    for (var i = 0; i < this.players.length; i++) {
      //generate networks for each of the children
      this.players[i].brain.generateNetwork();
    }
  }

  calculateFitnessSum() {
    this.fitnessSum = 0;
    for (var i = 0; i < this.players.length; i++) {
      this.fitnessSum += this.players[i].fitness;
    }
  }

  getAvgFitnessSum() {
    var averageSum = 0;
    for (var s of this.species) {
      averageSum += s.averageFitness;
    }
    return averageSum;
  }

  sortSpecies() {
    console.log("sortSpecies", this.species[0]);
    //sort the players within a this.species
    for (var s of this.species) {
      s.sortSpecies();
    }

    //sort the this.species by the fitness of its best player
    //using selection sort like a loser
    var temp = []; //new ArrayList<Species>();
    for (var i = 0; i < this.species.length; i++) {
      var max = 0;
      var maxIndex = 0;
      for (var j = 0; j < this.species.length; j++) {
        if (this.species[j].bestFitness > max) {
          max = this.species[j].bestFitness;
          maxIndex = j;
        }
      }
      temp.push(this.species[maxIndex]);
      this.species.splice(maxIndex, 1);
      i--;
    }

    this.species = [];
    arrayCopy(temp, this.species);
  }

  cullSpecies() {
    for (var s of this.species) {
      s.cull(); //kill bottom half
      s.fitnessSharing(); //also while we're at it lets do fitness sharing
      s.setAverage(); //reset averages because they will have changed
    }
  }

  killStaleSpecies() {
    for (var i = 2; i < this.species.length; i++) {
      if (this.species[i].staleness >= 15) {
        // .remove(i);
        // splice(this.species, i)
        this.species.splice(i, 1);
        i--;
      }
    }
  }
  //------------------------------------------------------------------------------------------------------------------------------------------
  //if a this.species sucks so much that it wont even be allocated 1 child for the nextthis.generation then kill it now
  killBadSpecies() {
    var averageSum = this.getAvgFitnessSum();

    for (var i = 1; i < this.species.length; i++) {
      if (
        (this.species[i].averageFitness / averageSum) * this.players.length <
        1
      ) {
        //if wont be given a single child
        // this.species.remove(i); //sad
        this.species.splice(i, 1);

        i--;
      }
    }
  }

  //-------------------------------------------------------------------------------------------------------------------------------------

  //chooses player from the population to return randomly(considering fitness)

  //this function works by randomly choosing a value between 0 and the sum of all the fitnesses
  //then go through all the players and add their fitness to a running sum and if that sum is greater than the random value generated that player is chosen
  //since players with a higher fitness function add more to the running sum then they have a higher chance of being chosen
  selectParent() {
    var rand = random(this.fitnessSum);

    var runningSum = 0;

    for (var i = 0; i < this.players.length; i++) {
      runningSum += this.players[i].fitness;
      if (runningSum > rand) {
        return this.players[i];
      }
    }

    //should never get to this point

    return null;
  }

  //------------------------------------------------------------------------------------------------------------------------------------------
  //mutates all the brains of the babies
  mutateDemBabies() {
    for (var i = 1; i < this.players.length; i++) {
      this.players[i].brain.mutate(
        this.players[i].deathByDot,
        this.players[i].deathAtStep
      );
      this.players[i].deathByDot = false;
      this.players[i].gen = this.gen;
    }
    this.players[0].deathByDot = false;
    this.players[0].gen = this.gen;
  }

  //---------------------------------------------------------------------------------------------------------------------------------------------
  //finds the player with the highest fitness and sets it as the best player
  setBestPlayer() {
    var max = 0;
    var maxIndex = 0;
    for (var i = 0; i < this.players.length; i++) {
      if (this.players[i].fitness > max) {
        max = this.players[i].fitness;
        maxIndex = i;
      }
    }

    this.bestPlayer = maxIndex;
  }
  speciate() {
    for (var s of this.species) {
      //empty this.species
      s.players = [];
    }
    for (var i = 0; i < this.players.length; i++) {
      //for each player
      var speciesFound = false;
      for (var s of this.species) {
        //for each this.species
        if (s.sameSpecies(this.players[i].brain)) {
          //if the player is similar enough to be considered in the same this.species
          s.addToSpecies(this.players[i]); //add it to the this.species
          speciesFound = true;
          break;
        }
      }
      if (!speciesFound) {
        //if no this.species was similar enough then add a new this.species with this as its champion
        this.species.push(new Species(this.players[i]));
      }
    }
  }
}
