var config = require('./Config');
var synaptic = require('synaptic');
var fs = require('fs');
// var UI = require('./UI');
var Architect = synaptic.Architect;
var Trainer = synaptic.Trainer;
var listOfJsonData = [
  'sharan_1484519607531__20.json',
  'sharan_1484519634461__20.json',
  'sharan_1484519656658__20.json',
  'sharan_1484519674253__20.json',
  'sharan_1484519692050__20.json',
  'sharan_1484519709638__20.json',
];

var dataDirectory = config.DATA_DIRECTORY;
var trainingData = [];

var buildNetwork = function (numInputs, numOutputs) {
  var network = new Architect.Perceptron(numInputs, 4, 4,numOutputs);
  return network;
}
var CustomTrainer = {
  //Define required attributes for trainer
}
CustomTrainer.trainNetwork = function()
{
  for(k in listOfJsonData)
  {
    var results = JSON.parse(fs.readFileSync(dataDirectory+'/'+listOfJsonData[k]));
    trainingData.push.apply(trainingData,results);
  }
  // console.log(trainingData);

  var current = [];
  var trainingSet = [];
  for(var k in trainingData)
  {
    var tempdict = {};
    current = trainingData[k];
    // console.log("Current.\n");
    // console.log(current);
    tempdict['input'] = current.slice(0,3); // Take the first three values as input
    tempdict['output'] = current.slice(3,5);  //Take the last two values as output
    tempdict['output'][0] /= 200;
    trainingSet.push(tempdict);
  }
  console.log(trainingSet);
  var neuralnet = buildNetwork(3,2);
  var trainer = new Trainer(neuralnet);


  trainer.train(trainingSet,{
      rate: .002,
      iterations: 30000,
      // error: .005,
      shuffle: true,
      log: 100,
      cost: Trainer.cost.CROSS_ENTROPY,// cost.MSE can be used as well
      // schedule: {
      // every: 500, // repeat this task every 500 iterations
      // do: function(data) {
      //     // custom log
      //     console.log("error", data.error, "iterations", data.iterations, "rate", data.rate);
      //     // if (someCondition)
      //     //     return true; // abort/stop training
      //     }
      // }
  });
  var jsonNeuralNet = neuralnet.toJSON();

  var fileName = config.NEURALNET_DATA_DIRECTORY+'/'+config.NEURALNET_DATA_FILE_PREFIX;
  //TODO: include the error and iterations in the filename
  fileName = fileName + Date.now() + '.json';
  fs.writeFile(fileName, JSON.stringify(jsonNeuralNet), function (err){
    if (err) {
      console.log("Error Occured while saving");
      // UI.logger.log('Failed to save manualData! '+err);
    } else {
      console.log("Saved neural net successfully to the file: ");
      console.log(fileName);
      // UI.logger.log('Saved to '+fileName);
    }
    // UI.refreshFiles();
  });
}

module.exports = CustomTrainer;
