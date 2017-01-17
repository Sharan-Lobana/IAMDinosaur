var fs = require('fs');
var GameManipulator = require('./GameManipulator');
var UI = require('./UI')

var DataCollection = {
  +
  manualData: [],
  numInstances: 0,
  maxInstances: 20,
  dataDirectory: './manualData',
  fileNamePrefix: 'sharan_',
  value:1,  // Normalised distance of obstacle
  speed:0,  // Speed of approaching obstacle
  size:1,   // Width of obstacle
  timeInMs:0, // Start time of keypress
  isInputRecorded:false // Boolean value set to true on recording inputs
};

DataCollection.saveCurrentInputs = function()
{
  DataCollection.value = GameManipulator.sensors[0].value;
  DataCollection.speed = GameManipulator.sensors[0].speed;
  DataCollection.size = GameManipulator.sensors[0].size;
  DataCollection.timeInMs = Date.now();
  DataCollection.isInputRecorded = true;
}

/**
* @param {number: which key is released(up/down) } res
*/
DataCollection.saveInstance = function(res)
{
  var instance = [];
  instance.push(DataCollection.value);
  instance.push(DataCollection.speed);
  instance.push(DataCollection.size);
  instance.push(Date.now() - DataCollection.timeInMs);
  instance.push(res);
  DataCollection.manualData.push(instance);
  DataCollection.numInstances++;

  if(DataCollection.maxNumInstances != -1 && DataCollection.numInstances >= DataCollection.maxInstances)
  {
    DataCollection.saveToFile();
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
