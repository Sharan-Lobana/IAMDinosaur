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
  network : null,
  // Set this, to verify genome experience BEFORE running it
  shouldCheckExperience: false,

};

//heuristic function to compute output based on input
function getOutput(inputs) {
  var output = 0.0;
  // console.log(inputs[1]);
  // console.log((inputs[2]+1.5)/10 +(inputs[1]+0.3)/3.0  + 0.25);
  var threshold = 0.9;
  if(inputs[5] < 0.75)
  {
    if(inputs[5] >= 0.65)
    threshold = (inputs[5])/3 - (inputs[4])/2.5 + 0.55;
    else {
      if(inputs[5] < 0.57)
        threshold = (inputs[5])/5 - (inputs[4])/2.0 + 0.35;
      else
        threshold = (inputs[5])/4 - (inputs[4])/2.0 + 0.5;
    }
  }
  else {
    if(inputs[5] > 0.85) {
      if(inputs[5] > 0.95)
      threshold = 0.95;
      else
      threshold = (inputs[5])/4 + 0.6;
    }
    else {
      threshold = (inputs[5])/2.5 - (inputs[4])/2.5 + 0.55;
    }
  }

  if(inputs[0] < Math.max(Math.min(0.9,threshold),0.35))
  output = 1.0
  else if((inputs[1] < 0.8 && inputs[0] > 0.9) || inputs[3] < 0.1)
  output = 0.0

  return output
}
// Initialize the Learner
Play.init = function (gameManip, ui) {
  Play.gm = gameManip;
  Play.ui = ui;
}


Play.loadnetwork = function(fileName)
{
  Play.network = Network.fromJSON(JSON.parse(fs.readFileSync(fileName)));
}


Play.executeNetwork = function() {

  if(this.network == null) {
    this.loadnetwork('./neuNetData/default.json');
  }

  if (Play.state == 'STOP') {
    return;
  }

  Play.gm.startNewGame(function (){

    // Reads sensor data, and apply network
    Play.gm.onSensorData = function (){
      var inputs = [
        Play.gm.sensors[0].value,
        Play.gm.sensors[1].value,
        Play.gm.sensors[2].value,
        Play.gm.sensors[3].value,
        Play.gm.sensors[0].size,
        Play.gm.sensors[0].speed,
      ];
      // console.log(inputs);
      // Apply to network
      // var output = Play.network.activate(inputs);

      //Debugging
      var output = getOutput(inputs);
      Play.gm.setGameOutput(output);
    }

    // Wait game end, and compute fitness
    Play.gm.onGameEnd = function (points){
      Play.ui.logger.log('Game ended. Total cactus jumped: '+points);
    }
  });
}



module.exports = Play;
