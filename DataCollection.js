var fs = require('fs');
var GameManipulator = require('./GameManipulator');
var UI = require('./UI')
var Config = require('./Config');

var DataCollection = {
  +
  manualData: [],
  numInstances: 0,
  maxInstances: 20,
  dataDirectory: Config.DATA_DIRECTORY,
  fileNamePrefix: Config.MANUAL_DATA_FILE_PREFIX,
  value:1,  // Normalised distance of obstacle
  speed:0,  // Speed of approaching obstacle
  size:1,   // Width of obstacle
  valueTwo:1, //Distance of head level terodactyl
  timeInMs:0, // Start time of keypress
  isInputRecorded:false // Boolean value set to true on recording inputs
};

DataCollection.saveCurrentInputs = function()
{
  DataCollection.value = GameManipulator.sensors[0].value;
  DataCollection.speed = GameManipulator.sensors[0].speed;
  DataCollection.size = GameManipulator.sensors[0].size;
  DataCollection.valueTwo = GameManipulator.sensors[1].value;
  DataCollection.timeInMs = Date.now();
  DataCollection.isInputRecorded = true;
  UI.logger.log(DataCollection.value+" "+DataCollection.speed+" "+DataCollection.size+" "+DataCollection.valueTwo);
}

/**
* @param {number: which key is released(up/down) } res
*/
DataCollection.saveInstance = function(res)
{
  //If the obstacle is near, don't record the norm
  if( (res - 0.5 <= 0.001 || 0.5 - res <= 0.001) && (DataCollection.value < 0.5))
  {
      DataCollection.isInputRecorded = false;
  }
  else
  {
   var instance = [];
    instance.push(DataCollection.value);
    instance.push(DataCollection.speed);
    instance.push(DataCollection.size);
    instance.push(DataCollection.valueTwo);
    instance.push(res);
    instance.push(Date.now() - DataCollection.timeInMs);
    DataCollection.manualData.push(instance);
    DataCollection.numInstances++;

    if(DataCollection.maxNumInstances != -1 && DataCollection.numInstances >= DataCollection.maxInstances)
    {
      DataCollection.saveToFile();
    }
  }
}

DataCollection.saveToFile = function()
{
  var annData = [];
  annData = DataCollection.manualData;

  // for( var k in DataCollection.manualData)
  // {
  //   annData.push(DataCollection.manualData[k]);
  // }

  var fileName = DataCollection.dataDirectory+'/'+DataCollection.fileNamePrefix;
  fileName = fileName + Date.now()+'__'+DataCollection.numInstances+'.json';
  fs.writeFile(fileName, JSON.stringify(annData), function (err){
    if (err) {
      UI.logger.log('Failed to save manualData! '+err);
    } else {
      UI.logger.log('Saved to '+fileName);
      DataCollection.manualData = [];
      DataCollection.numInstances = 0;
    }
    // UI.refreshFiles();
  });
}

DataCollection.saveOnGameEnd = function()
{
  if(GameManipulator.gamestate == 'OVER' && DataCollection.numInstances > 0)
  {
    DataCollection.saveToFile();
  }
}

module.exports = DataCollection;
