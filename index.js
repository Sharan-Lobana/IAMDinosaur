var robot = require('robotjs');
var http = require('http');
var url = require('url');
var GameManipulator = require('./GameManipulator');
var Scanner = require('./Scanner');
var UI = require('./UI');
var DataCollection = require('./DataCollection');
var config = require('./Config');
var train = require('./CustomTrainer');
var Play = require('./Play');
var isCollecting = config.IS_COLLECTING_DATA; //set it to true to collect data on manual training
var isAutoPlaying = config.IS_AUTO_PLAYING;
var isTraining = config.IS_TRAINING;
// Configure Robotjs
robot.setMouseDelay(1);

// Initialize Game
GameManipulator.findGamePosition();

// Check for found game
if (GameManipulator.offset) {
  // Uncomment this line to debug the
  // starting point of sensor (Check if it's detecting it correcly)

  // robot.moveMouse(GameManipulator.offset[0]+GameManipulator.sensors[0].offset[0],
  //    GameManipulator.offset[1] + GameManipulator.sensors[0].offset[1]);

  robot.moveMouse(GameManipulator.offset[0], GameManipulator.offset[1]);
} else {
  console.error('FAILED TO FIND GAME!');
  process.exit();
}

// Initialize UI
UI.init(GameManipulator, Play);

// Initialize Play
Play.init(GameManipulator, UI);
// Start reading game state and sensors
setInterval(GameManipulator.readSensors, 40);
setInterval(GameManipulator.readGameState, 200);
// setInterval(DataCollection.saveOnGameEnd,200);

console.log("Num of instances are "+DataCollection);
//If manual play mode is on
if(isCollecting == true)
{
  var server = http.createServer(function(request, response)
  {
    var path = url.parse(request.url).pathname;

    if(path == "/keydown/jumpstart" || path == "/keydown/duckstart")
    {
      DataCollection.saveCurrentInputs();
      UI.logger.log(path);
      response.writeHead(200, {"Content-Type": "text/plain"});
      response.end("Inputs saved in backend");
    }
    else if(path == "/keyup/jumpend")
    {
      if(DataCollection.isInputRecorded == true)
      {
        DataCollection.saveInstance(1);
        DataCollection.isInputRecorded = false;
        UI.logger.log(path);
        response.writeHead(200, {"Content-Type": "text/plain"});
        response.end("Jump Finished");
      }
      else
      {
        response.writeHead(200, {"Content-Type": "text/plain"});
        response.end("No input recorded for given jumpend");
      }

    }
    else if(path == "/keyup/duckend")
    {
      if(DataCollection.isInputRecorded == true)
      {
        DataCollection.saveInstance(0);
        DataCollection.isInputRecorded = false;
        UI.logger.log(path);
        response.writeHead(200, {"Content-Type": "text/plain"});
        response.end("Duck Ended");
      }
      else
      {
        response.writeHead(200, {"Content-Type": "text/plain"});
        response.end("No input recorded for given duckend");
      }
    }
  }).listen(8001);

  console.log("Server Initialized");
}
if(isTraining == true)
{
  train.trainNetwork();
}
if(isAutoPlaying == true)
{
  console.log("Came here.");
  var neuralNetDir = config.NEURALNET_DATA_DIRECTORY;
  var fileName = neuralNetDir+"/"+"sharan_1484676016339.json";
  Play.loadnetwork(fileName);
  Play.executeNetwork();
}


// Start game (Example of API usage)
/*
function startGame () {
  var game = Math.round(Math.random() * 100);

  UI.logger.log('Queuing start... ', game);

  GameManipulator.startNewGame(function() {
    UI.logger.log('Game HAS started!', game);
    GameManipulator.onGameEnd = function () {
      UI.logger.log('Game HAS ended!', game);

      startGame();
    }
  });
}
*/
