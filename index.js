var robot = require('robotjs');
var http = require('http');
var url = require('url');
var GameManipulator = require('./GameManipulator');
var Learner = require('./Learner');
var Scanner = require('./Scanner');
var UI = require('./UI');
var DataCollection = require('./DataCollection');
var collecting = true; //set it to true to collect data on manual training

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
UI.init(GameManipulator, Learner);

// Initialize Learner

Learner.init(GameManipulator, UI, 12, 4, 0.2);


// Start reading game state and sensors
setInterval(GameManipulator.readSensors, 40);
setInterval(GameManipulator.readGameState, 200);
setInterval(DataCollection.saveOnGameEnd,200);

console.log("Num of instances are "+DataCollection);
//If manual play mode is on
if(collecting)
{
  var server = http.createServer(function(request, response)
  {
    var path = url.parse(request.url).pathname;
    if(path == "/keyup")
    {
      DataCollection.saveInstance(1);
      UI.logger.log(path);
      response.writeHead(200, {"Content-Type": "text/plain"});
      response.end("Up Key Recorded");
    }
    else if(path == "/keydown")
    {
      DataCollection.saveInstance(0);
      UI.logger.log(path);
      response.writeHead(200, {"Content-Type": "text/plain"});
      response.end("Down Key Recorded");
    }
  }).listen(8001);

  console.log("Server Initialized");
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
