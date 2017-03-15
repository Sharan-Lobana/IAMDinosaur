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
        Play.gm.sensors[0].size,
        Play.gm.sensors[0].speed,
        Play.gm.sensors[1].value,
      ];
      // console.log(inputs);
      // Apply to network
      var output = Play.network.activate(inputs);

      Play.gm.setGameOutput(output);
    }

    // Wait game end, and compute fitness
    Play.gm.onGameEnd = function (points){
      Play.ui.logger.log('Game ended. Total cactus jumped: '+points);
    }
  });
}



module.exports = Play;
