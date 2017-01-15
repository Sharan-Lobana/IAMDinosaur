var fs = require('fs');
var GameManipulator = require('./GameManipulator');
var UI = require('./UI')

var DataCollection = {
  manualData: [],
  numInstances: 0,
  maxInstances: 20,
  dataDirectory: './manualData',
  fileNamePrefix: 'sharan_',
  value:1,
  speed:0,
  size:1,
  timeInMs:0,
  isInputRecorded:false
};

DataCollection.saveCurrentInputs = function()
{
  DataCollection.value = GameManipulator.sensors[0].value;
  DataCollection.speed = GameManipulator.sensors[0].speed;
  DataCollection.size = GameManipulator.sensors[0].size;
  DataCollection.timeInMs = Date.now();
  DataCollection.isInputRecorded = true;
}

DataCollection.saveInstance = function(res)
{
  var instance = [];
  instance.push(DataCollection.value);
  instance.push(DataCollection.speed);
  instance.push(DataCollection.size);
  instance.push(Date.now() - DataCollection.timeInMs);
  DataCollection.push(res);
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
  for( var k in DataCollection.manualData)
  {
    annData.push(DataCollection.manualData[k]);
  }
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
