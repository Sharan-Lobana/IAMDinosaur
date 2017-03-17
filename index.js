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
var FilterData = require('./FilterData');
var qs = require('querystring');

var currentGameSpeed = 6.0;
var isCollecting = config.IS_COLLECTING_DATA; //set it to true to collect data on manual training
var isAutoPlaying = config.IS_AUTO_PLAYING;
var isTraining = config.IS_TRAINING;
var isFiltering = config.IS_FILTERING_DATA;
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
setInterval(function() {
  GameManipulator.readSensors(currentGameSpeed);
}, 40);
setInterval(GameManipulator.readGameState, 200);
// setInterval(DataCollection.saveOnGameEnd,200);

//If manual play mode is on

var server = http.createServer(function(request, response)
{
  // console.log("inside server");
  var path = url.parse(request.url).pathname;
  if(isCollecting == true) {
    if(path == '/norm')
    {
      DataCollection.saveCurrentInputs();
      DataCollection.saveInstance(0.5);
      // logging mechanism
      DataCollection.isInputRecorded = false;
      UI.logger.log(path);
      response.writeHead(200, {"Content-Type": "text/plain"});
      response.end("Norm Saved");
    }

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
  }
  if(path == "/currentSpeed") {
    if (request.method == 'POST') {
        var body = '';
        request.on('data', function (data) {
            body += data;
            // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
            if (body.length > 1e7) {
                // FLOOD ATTACK OR FAULTY CLIENT, NUKE REQUEST
                request.connection.destroy();
            }
        });
        request.on('end', function () {
            var POST = qs.parse(body);
            // use POST
            currentGameSpeed = POST['currentSpeed'];
        });
        response.writeHead(200, {"Content-Type": "text/plain"});
        response.end("Current Speed"+currentGameSpeed/12.0);
      }
  }
}).listen(8001);

console.log("Server Initialized");

if(isTraining == true)
{
  train.trainNetwork();
}
if(isAutoPlaying == true)
{
  var neuralNetDir = config.NEURALNET_DATA_DIRECTORY;
  var fileName = neuralNetDir+"/sharan_new_1489616200634.json";
  Play.loadnetwork(fileName);
  Play.executeNetwork();
}
if(isFiltering == true)
{
  console.log("Filtering user collected data.");
  FilterData.getFilteredData();
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
