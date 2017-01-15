var fs = require('fs');
var GameManipulator = require('./GameManipulator');
var UI = require('./UI')

var DataCollection = {
  manualData: [],
  numInstances: 0,
  maxInstances: 10,
  dataDirectory: './manualData',
  fileNamePrefix: 'sharan_',
};

DataCollection.saveInstance = function(res)
{
  var instance = [];
  instance.push(GameManipulator.sensors[0].value);
  instance.push(GameManipulator.sensors[0].speed);
  instance.push(GameManipulator.sensors[0].size);
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
