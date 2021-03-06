var robot = require('robotjs');

// Cache screen size
var screenSize = robot.getScreenSize();

var Scanner = require ('./Scanner');

// COLOR DEFINITIONS
// This is the Dino's colour, also used by Obstacles.
var COLOR_DINOSAUR = '535353';
var DARK_COLOR_DINO = 'ACACAC';

var GameManipulator = {

  // Stores the game position (Globally)
  offset: null,
  width: null,

  // Stores points (jumps)
  points: 0,

  // Listners
  onGameEnd: null,
  onGameStart: null,
  onSensorData: null,

  // Game State
  gamestate: 'OVER',

  // GameOver Position
  gameOverOffset: [190, -82],

  // Stores an array of "sensors" (Ray tracings)
  // Positions are always relative to global "offset"
  sensors: [
    {
      lastValue: 1,

      value: null,
      offset: [84, -13], // 64,-15
      step: [4, 0],
      length: 0.4,

      // Speed
      speed: 0,
      lastComputeSpeed: 0,

      // Computes size of the object
      size: 0,
      computeSize: true,
    },
    {
      lastValue:1, // sensor 2 : for detecting the cacti/pterodactyl, that is at the head level.

      value:null,
      offset:[69,-40], // this point is somwhere near the head of the dinosaur;
      step: [4,0], // step size can be reduced...
      length: 0.4,
    },
    {
      lastValue:1, //Backward sensor for detecting Cactii

      value:null,
      offset:[25,-15], // this point is somwhere near the head of the dinosaur;
      step: [-1,0], // step size can be reduced...
      length: 0.3,
    },
    {
      lastValue:1, //Backward sensor for detecting pterodactyl

      value:null,
      offset:[25,-40], // this point is somwhere near the head of the dinosaur;
      step: [-1,0], // step size can be reduced...
      length: 0.3,
    },
  ]
};


// Find out dinosaur (fast)
GameManipulator.findGamePosition = function () {
  var pos, dinoPos, skipXFast = 15;

  for (var x = 20; x < screenSize.width; x+= skipXFast) {
    dinoPos = Scanner.scanUntil(
      // Start position
      [x, 80],
      // Skip pixels
      [0, skipXFast],
      // Searching Color
      COLOR_DINOSAUR,
      // Normal mode (not inverse)
      false,
      // Iteration limit
      500 / skipXFast);

    if (dinoPos) {
      break;
    }
  }

  if (!dinoPos) {
    return null;
  }

  for (var x = dinoPos[0] - 50; x <= dinoPos[0]; x += 1) {
    pos = Scanner.scanUntil(
      // Start position
      [x, dinoPos[1] - 2],
      // Skip pixels
      [0, 1],
      // Searching Color
      COLOR_DINOSAUR,
      // Normal mode (not inverse)
      false,
      // Iteration limit
      100);

    if (pos) {
      break;
    }
  }

  // Did actually found? If not, error!
  if (!pos) {
    return null;
  }

  // Find the end of the game
  var endPos = pos;

  while (robot.getPixelColor(endPos[0] + 3, endPos[1]) == COLOR_DINOSAUR) {
     endPos = Scanner.scanUntil(
        // Start position
        [endPos[0] + 2, endPos[1]],
        // Skip pixels
        [2, 0],
        // Searching Color
        COLOR_DINOSAUR,
        // Invert mode
        true,
        // Iteration limit
        600);
  }

  // Did actually found? If not, error!
  if (!endPos) {
    return null;
  }

  // Save to allow global access
  GameManipulator.offset = pos;
  GameManipulator.width = 600;//endPos[0] - pos[0];

  return pos;
};


// Read Game state
// (If game is ended or is playing)
GameManipulator.readGameState = function () {
  // Read GameOver
  var found = Scanner.scanUntil(
    [
      GameManipulator.offset[0] + GameManipulator.gameOverOffset[0],
      GameManipulator.offset[1] + GameManipulator.gameOverOffset[1]
    ],

    [2, 0], COLOR_DINOSAUR, false, 20);

  if (found && GameManipulator.gamestate != 'OVER') {
    GameManipulator.gamestate = 'OVER';
    console.log("GAME OVER");
    // Clear keys
    GameManipulator.setGameOutput(0.5);

    // Trigger callback and clear
    if(!GameManipulator.onGameEnd)
    console.log("Game Manipulator onGameEnd is null");
    GameManipulator.onGameEnd && GameManipulator.onGameEnd(GameManipulator.points);
    GameManipulator.onGameEnd = null;

    // console.log('GAME OVER: '+GameManipulator.points);

  } else if (!found && GameManipulator.gamestate != 'PLAYING') {
    GameManipulator.gamestate = 'PLAYING';

    // Clear points
    GameManipulator.points = 0;
    GameManipulator.lastScore = 0;

    // Clear keys
    GameManipulator.setGameOutput(0.5);

    // Clear sensors
    GameManipulator.sensors[0].lastComputeSpeed = 0;
    GameManipulator.sensors[0].lastSpeeds = [];
    GameManipulator.sensors[0].lastValue = 1;
    GameManipulator.sensors[0].value = 1;
    GameManipulator.sensors[0].speed = 0;
    GameManipulator.sensors[0].size = 0;

    for(var i = 1; i <= 3; i++)
    {
      GameManipulator.sensors[i].value = 1;
      GameManipulator.sensors[i].lastValue = 1;
    }

    // Clear Output flags
    GameManipulator.lastOutputSet = 'NONE';

    // Trigger callback and clear
    console.log("Callback GameStart will be triggered");
    // if(!GameManipulator.onGameStart)
    // console.log("onGame start is null");

    GameManipulator.onGameStart && GameManipulator.onGameStart();
    GameManipulator.onGameStart = null;

    // console.log('GAME RUNNING '+GameManipulator.points);
  }
}


// Call this to start a fresh new game
// Will wait untill game has ended,
// and call the `next` callback
var _startKeyInterval;
GameManipulator.startNewGame = function (next) {

  if(!GameManipulator.onSensorData)
  console.log("onSensorData is not set");
  // Refresh state
  console.log('abc');
  console.log("\n\nThe game state is "+GameManipulator.gamestate);
  GameManipulator.readGameState();
  console.log("Something should be logged");

  if(GameManipulator.gamestate == 'PLAYING') {
    next && next(); //This sets the function onSensorData and onGameEnd
    console.log("Game state was playing. OnSensorData was set.");
  }
  // If game is already over, press space
  if (GameManipulator.gamestate == 'OVER') {
    clearInterval(_startKeyInterval);
    // if(_startKeyInterval) {
    //   console.log("Start Key interval wasn't null");
    //
    // }
    // else {
    //   console.log("Start key interval was null");
    //   // Press space to begin game (repeatedly)
    //   _startKeyInterval = setInterval(function (){
    //     // Due to dino slowly gliding over the screen after multiple restarts, its better to just reload the page
    //     GameManipulator.reloadPage();
    //     setTimeout(function() {
    //       // Once reloaded we wait 0.5sec for it to let us start the game with a space.
    //         robot.keyTap(' ');
    //     }, 1000);
    //   }, 2000);
    // }

    // Set start callback
    GameManipulator.onGameStart = function() {
      clearInterval(_startKeyInterval);
      // console.log("Next will be called after this", next);
      next && next();
    };

    // Press space to begin game (repeatedly)
    _startKeyInterval = setInterval(function (){
      // Due to dino slowly gliding over the screen after multiple restarts, its better to just reload the page
      GameManipulator.reloadPage();
      setTimeout(function() {
        // Once reloaded we wait 0.5sec for it to let us start the game with a space.
          robot.keyTap(' ');
      }, 1000);
    }, 2000);

    // Refresh state
    GameManipulator.readGameState();

  } else {
    // Wait die, and call recursive action
    GameManipulator.onGameEnd = function () {
      GameManipulator.startNewGame(next);
    }
  }
}

// reload the page
GameManipulator.reloadPage = function ()
{
  // retrieves platform
  var platform = process.platform;

  if(/^win/.test(process.platform)) {
    robot.keyTap('r','control');
  } else if(/^darwin/.test(process.platform)) {
    robot.keyTap('r','command');
  } else if(/^linux/.test(process.platform)) {
    robot.keyTap('r','control');
  }
}


// Compute points based on sensors
//
// Basicaly, checks if an object has
// passed trough the sensor and the
// value is now higher than before
GameManipulator.computePoints = function () {
  for (var k in GameManipulator.sensors) {
    var sensor = GameManipulator.sensors[k];

    //If a cactus has been jumped over or a terodactyl has been ducked
    //then increment the points
    if (sensor.value > 0.5 && sensor.lastValue < 0.3) {
      GameManipulator.points++;
      // console.log('POINTS: '+GameManipulator.points);
    }
  }
}


// Read sensors
//
// Sensors are like ray-traces:
//   They have a starting point,
//   and a limit to search for.
//
// Each sensor can gatter data about
// the DISTANCE of the object, it's
// SIZE and it's speed
//
// Note: We currently only have a sensor.
GameManipulator.readSensors = function (currentGameSpeed) {
  var offset = GameManipulator.offset;

  //Begin:Computing value of first sensor
  var sensor = GameManipulator.sensors[0];

  // Calculate absolute position of ray tracing
  var start = [
    offset[0] + sensor.offset[0],
    offset[1] + sensor.offset[1],
  ];

  var end = Scanner.scanUntil(
    // console.log(
      // Start position
      [start[0], start[1]],
      // Skip pixels
      sensor.step,
      // Searching Color
      COLOR_DINOSAUR,
      // Invert mode?
      false,
      // Iteration limit
      (GameManipulator.width * sensor.length) / sensor.step[0]);

  // Save lastValue
  sensor.lastValue = sensor.value;

  // Calculate the Sensor value
  if (end) {
    sensor.value = (end[0] - start[0]) / (GameManipulator.width * sensor.length);

    // Calculate size of obstacle
    //TODO: check the width of obstacles (currently 75)
    var endPoint = Scanner.scanUntil(
      [end[0] + 75, end[1]],
      [-2, 0],
      COLOR_DINOSAUR,
      false,
      75 / 2
    );

    // If no end point, set the start point as end
    if (!endPoint) {
      endPoint = end;
    }

    //TODO Improve normalisation of obstacle size
    var sizeTmp = (endPoint[0] - end[0]) / 100.0;
    if (GameManipulator.points == sensor.lastScore) {
      // It's the same obstacle. Set size to "max" of both
      sensor.size = Math.max(sensor.size, sizeTmp);
    } else {
      sensor.size = sizeTmp;
    }


    // We use the current score to check for object equality
    sensor.lastScore = GameManipulator.points;

    // sensor.size = Math.max(sensor.size, endPoint[0] - end[0]);

  } else {
    sensor.value = 1;
    sensor.size = 0;
  }

  // // Compute speed
  // var dt = (Date.now() - sensor.lastComputeSpeed) / 1000;
  // sensor.lastComputeSpeed = Date.now();
  //
  // if (sensor.value < sensor.lastValue) {
  //   // Compute speed
  //   var newSpeed = (sensor.lastValue - sensor.value) / dt;
  //
  //   sensor.lastSpeeds.unshift(newSpeed);
  //
  //   while (sensor.lastSpeeds.length > 5) {
  //     sensor.lastSpeeds.pop();
  //   }
  //
  //   //TODO Improve speed calculation
  //   // Take Average
  //   var avgSpeed = 0;
  //   for (var k in sensor.lastSpeeds) {
  //     avgSpeed += sensor.lastSpeeds[k] / sensor.lastSpeeds.length;
  //   }
  //
  //   sensor.speed = Math.max(avgSpeed, sensor.speed);
  //   // sensor.speed = newSpeed;
  // }
  sensor.speed = currentGameSpeed/12.0;
  // Save length/size of sensor value
  sensor.size = Math.min(sensor.size, 1.0);

  // End:Computing value of first sensor
  // Begin:Computing value of second sensor
  sensor = GameManipulator.sensors[1];

  // Calculate absolute position of ray tracing
  start = [
    offset[0] + sensor.offset[0],
    offset[1] + sensor.offset[1],
  ];

  end = Scanner.scanUntil(
    // console.log(
      // Start position
      [start[0], start[1]],
      // Skip pixels
      sensor.step,
      // Searching Color
      COLOR_DINOSAUR,
      // Invert mode?
      false,
      // Iteration limit
      (GameManipulator.width * sensor.length) / sensor.step[0]);

  // Save lastValue
  sensor.lastValue = sensor.value;

  // Calculate the Sensor value
  if (end) {
    sensor.value = (end[0] - start[0]) / (GameManipulator.width * sensor.length);
  }
  else {
    sensor.value = 1;
    sensor.size = 0;
  }

  //Compute the value of the backward sensors
  for(var i = 2; i < 4; i++) {
    sensor = GameManipulator.sensors[i];

    // Calculate absolute position of ray tracing
    start = [
      offset[0] + sensor.offset[0],
      offset[1] + sensor.offset[1],
    ];

    end = Scanner.scanUntil(
      // console.log(
        // Start position
        [start[0], start[1]],
        // Skip pixels
        sensor.step,
        // Searching Color
        COLOR_DINOSAUR,
        // Invert mode?
        false,
        // Iteration limit
        50);

    // Save lastValue
    sensor.lastValue = sensor.value;

    // Calculate the Sensor value
    if (end) {
      sensor.value = (start[0] - end[0]) / (GameManipulator.width * sensor.length);
    }
    else {
      sensor.value = 1;
      sensor.size = 0;
    }
  }

  // Compute points
  GameManipulator.computePoints();
  // Call sensor callback (to act)
  GameManipulator.onSensorData && GameManipulator.onSensorData();
}


// Set action to game
// Values:
//  0.0 to  0.4: DOWN
//  0.4 to  0.6: NOTHING
//  0.6 to  1.0: UP (JUMP)
var PRESS = 'down';
var RELEASE = 'up';

GameManipulator.lastOutputSet = 'NONE';
GameManipulator.lastOutputSetTime = 0;

GameManipulator.setGameOutput = function (output){

  GameManipulator.gameOutput = output;
  GameManipulator.gameOutputString = GameManipulator.getDiscreteState(output);

  if (GameManipulator.gameOutputString == 'DOWN') {
    // Skew
    robot.keyToggle('up', RELEASE);
    robot.keyToggle('down', PRESS);
  } else if (GameManipulator.gameOutputString == 'NORM') {
    // DO Nothing
    robot.keyToggle('up', RELEASE);
    robot.keyToggle('down', RELEASE);
  } else {

    // Filter JUMP
    if (GameManipulator.lastOutputSet != 'JUMP') {
      GameManipulator.lastOutputSetTime = Date.now();
    }

    // JUMP
    // Check if hasn't jump for more than 3 continuous secconds
    // if (Date.now() - GameManipulator.lastOutputSetTime < 5000) {
      robot.keyToggle('down', RELEASE);
      robot.keyToggle('up', PRESS);

    // } else {
    //   robot.keyToggle('up', RELEASE);
    //   robot.keyToggle('down', RELEASE);
    // }

  }

  GameManipulator.lastOutputSet = GameManipulator.gameOutputString;
}


//
// Simply maps an real number to string actions
//
GameManipulator.getDiscreteState = function (value){
  if (value <= 0.45) {
    return 'DOWN'
  } else if(value > 0.85) {
    return 'JUMP';
  }

  return 'NORM';
}


// Click on the Starting point
// to make sure game is focused
GameManipulator.focusGame = function (){
  robot.moveMouse(GameManipulator.offset[0], GameManipulator.offset[1]);
  robot.mouseClick('left');
}

module.exports = GameManipulator;
