var synaptic = require('synaptic');
var fs = require('fs');
// var async = require('async');
// var _ = require('lodash');

//TODO: change the learn module to autoplay module removing
// the code of genetic algorithms
var Architect = synaptic.Architect;
var Network = synaptic.Network;

var Play = {
  // Current state of learning [STOP, LEARNING]
  state: 'STOP',
  network : {},
  // Set this, to verify genome experience BEFORE running it
  shouldCheckExperience: false,

};


// Initialize the Learner
Play.init = function (gameManip, ui) {
  Play.gm = gameManip;
  Play.ui = ui;
}


Play.loadnetwork = function(fileName)
{
  Play.network = Network.fromJSON(JSON.parse(fs.readFileSync(fileName)));
}

// Given the entire generation of genomes (An array),
// applyes method `executeGenome` for each element.
// After all elements have completed executing:
//
// 1) Select best genomes
// 2) Does cross over (except for 2 genomes)
// 3) Does Mutation-only on remaining genomes
// 4) Execute generation (recursivelly)
Play.executeNetwork = function (){
  if (Play.state == 'STOP') {
    return;
  }

  Play.ui.logger.log('Executing network ');



  async.mapSeries(Play.genomes, Play.executeGenome, function (argument) {

    // Kill worst genome

    // Mutation-only
    while (Play.genomes.length < Play.genomeUnits) {
      // Get two random Genomes
      var gen = _.sample(bestGenomes).toJSON();

      // Cross over and Mutate
      var newGenome = Play.mutate(gen);

      // Add to generation
      Play.genomes.push(Network.fromJSON(newGenome));
    }

    Play.ui.logger.log('Completed generation '+Play.generation);

    // Execute next generation
    Play.executeNetwork();
  })
}


// Sort all the genomes, and delete the worst one
// untill the genome list has selectN elements.
Play.selectBestGenomes = function (selectN){
  var selected = _.sortBy(Play.genomes, 'fitness').reverse();

  while (selected.length > selectN) {
    selected.pop();
  }

  Play.ui.logger.log('Fitness: '+_.pluck(selected, 'fitness').join(','));

  return selected;
}


// Waits the game to end, and start a new one, then:
// 1) Set's listener for sensorData
// 2) On data read, applyes the neural network, and
//    set it's output
// 3) When the game has ended and compute the fitness
Play.executeGenome = function (genome, next){
  if (Play.state == 'STOP') {
    return;
  }

  Play.genome = Play.genomes.indexOf(genome) + 1;
  // Play.ui.logger.log('Executing genome '+Play.genome);

  // Check if genome has AT LEAST some experience
  if (Play.shouldCheckExperience) {
    if (!Play.checkExperience(genome)) {
      genome.fitness = 0;
      // Play.ui.logger.log('Genome '+Play.genome+' has no min. experience');
      return next();
    }
  }

  Play.gm.startNewGame(function (){

    // Reads sensor data, and apply network
    Play.gm.onSensorData = function (){
      var inputs = [
        Play.gm.sensors[0].value,
        Play.gm.sensors[0].size,
        Play.gm.sensors[0].speed,
      ];
      // console.log(inputs);
      // Apply to network
      var outputs = Play.network.activate(inputs);

      Play.gm.setGameOutput(outputs[1]);
    }

    // Wait game end, and compute fitness
    Play.gm.onGameEnd = function (points){
      Play.ui.logger.log('Genome '+Play.genome+' ended. Fitness: '+points);

      // Save Genome fitness
      genome.fitness = points;

      // Go to next genome
      next();
    }
  });

}


// Validate if any acction occur uppon a given input (in this case, distance).
// If genome only keeps a single activation value for any given input,
// it will return false
Play.checkExperience = function (genome) {

  var step = 0.1, start = 0.0, stop = 1;

  // Inputs are default. We only want to test the first index
  var inputs = [0.0, 0.3, 0.2];
  var activation, state, outputs = {};

  for (var k = start; k < stop; k += step) {
    inputs[0] = k;

    activation = genome.activate(inputs);
    state = Play.gm.getDiscreteState(activation);

    outputs[state] = true;
  }

  // Count states, and return true if greater than 1
  return _.keys(outputs).length > 1;
}


// Load genomes saved from JSON file
Play.loadGenomes = function (genomes, deleteOthers){
  if (deleteOthers) {
    Play.genomes = [];
  }

  var loaded = 0;
  for (var k in genomes) {
    Play.genomes.push(Network.fromJSON(genomes[k]));
    loaded++;
  }

  Play.ui.logger.log('Loaded '+loaded+' genomes!');
}


// Builds a new genome based on the
// expected number of inputs and outputs
Play.buildGenome = function (inputs, outputs) {
  Play.ui.logger.log('Build genome '+(Play.genomes.length+1));

  var network = new Architect.Perceptron(inputs, 4, 4, outputs);

  return network;
}


// SPECIFIC to Neural Network.
// Those two methods convert from JSON to Array, and from Array to JSON
Play.crossOver = function (netA, netB) {
  // Swap (50% prob.)
  if (Math.random() > 0.5) {
    var tmp = netA;
    netA = netB;
    netB = tmp;
  }

  // Clone network
  netA = _.cloneDeep(netA);
  netB = _.cloneDeep(netB);

  // Cross over data keys
  Play.crossOverDataKey(netA.neurons, netB.neurons, 'bias');

  return netA;
}


// Does random mutations across all
// the biases and weights of the Networks
// (This must be done in the JSON to
// prevent modifying the current one)
Play.mutate = function (net){
  // Mutate
  Play.mutateDataKeys(net.neurons, 'bias', Play.mutationProb);

  Play.mutateDataKeys(net.connections, 'weight', Play.mutationProb);

  return net;
}


// Given an Object A and an object B, both Arrays
// of Objects:
//
// 1) Select a cross over point (cutLocation)
//    randomly (going from 0 to A.length)
// 2) Swap values from `key` one to another,
//    starting by cutLocation
Play.crossOverDataKey = function (a, b, key) {
  var cutLocation = Math.round(a.length * Math.random());

  var tmp;
  for (var k = cutLocation; k < a.length; k++) {
    // Swap
    tmp = a[k][key];
    a[k][key] = b[k][key];
    b[k][key] = tmp;
  }
}


// Given an Array of objects with key `key`,
// and also a `mutationRate`, randomly Mutate
// the value of each key, if random value is
// lower than mutationRate for each element.
Play.mutateDataKeys = function (a, key, mutationRate){
  for (var k = 0; k < a.length; k++) {
    // Should mutate?
    if (Math.random() > mutationRate) {
      continue;
    }

    a[k][key] += a[k][key] * (Math.random() - 0.5) * 3 + (Math.random() - 0.5);
  }
}


module.exports = Learn;
