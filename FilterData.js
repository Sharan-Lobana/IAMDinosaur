var fs = require('fs');
var Config = require('./Config');
var UI = require('./UI');
var dataDirectory = Config.DATA_DIRECTORY;
var listOfUnfilteredData = [
  'sharan_new_1489607960663__20.json',
  'sharan_new_1489607989121__20.json',
  'sharan_new_1489608011579__20.json',
  'sharan_new_1489608028327__20.json',
];

var FilterData = {
  numInstancesEach : 20,
  removeOutliers: true,
  outlierZScore: 1.25,
  dataDirectory: Config.FILTERED_DATA_DIRECTORY,
  fileNamePrefix: Config.FILTERED_DATA_FILE_PREFIX,

}

FilterData.isOutlier = function(averageData, stDeviation, currentData) {
  var zvalue = 0;
  for(var i = 0; i < 4; i++) {
    zvalue = (currentData[i] - averageData[i])/stDeviation[i];
    if(zvalue > FilterData.outlierZScore || zvalue < -1*FilterData.outlierZScore)
    return true;
  }
  return false;
}

FilterData.getFilteredData = function() {
  var unfilteredData = [];

  for(var k in listOfUnfilteredData) {
    var results = JSON.parse(fs.readFileSync(dataDirectory+'/'+listOfUnfilteredData[k]));
    unfilteredData.push.apply(unfilteredData,results);
  }

  //remove the time component from data points
  for(var k in unfilteredData) {
    unfilteredData[k] = unfilteredData[k].slice(0,5);
  }

  var totalJump = [0,0,0,0];
  var totalDuck = [0,0,0,0];

  var totalJumpSquare = [0,0,0,0];
  var totalDuckSquare = [0,0,0,0];

  var averageJump = [], averageDuck = [], stdJump = [], stdDuck = [];
  var numJump = 0;
  var numDuck = 0;

  for(var k in unfilteredData) {
    var current = unfilteredData[k];
    if(current[4] == 1) {
      numJump += 1;
      for(var i = 0; i < 4; i++) {
        totalJump[i] += current[i];
        totalJumpSquare[i] += current[i]*current[i];
      }
    }
    else if(current[4] == 0) {
      numDuck += 1;
      for(var i = 0; i < 4; i++) {
        totalDuck[i] += current[i];
        totalDuckSquare[i] = current[i]*current[i];
      }
    }
    else {
      console.log("Error: Data filteration. Result doesn't correspond to 1 or 0");
    }
  }

  console.log("\n\n\nNum Jump data points: "+numJump);
  console.log("\n\n\nNum Duck data points: "+numDuck);
  //Calculate averages and standard deviations
  for(var i = 0; i < 4; i++) {
    averageJump[i] = totalJump[i]/numJump;
    averageDuck[i] = totalDuck[i]/numDuck;
    stdJump[i] = Math.sqrt((totalJumpSquare[i]/numJump)-Math.pow(averageJump[i],2));
    stdDuck[i] = Math.sqrt((totalDuckSquare[i]/numDuck)-Math.pow(averageDuck[i],2));
  }

  var filteredJumpData = [];
  var filteredDuckData = [];

  //Remove Outliers from data
  for(var i in unfilteredData) {
    var current = unfilteredData[i];
    if(current[4] == 1) {
      if(FilterData.isOutlier(averageJump, stdJump, current) == false) {
        filteredJumpData.push(current);
      }
    }
    else if(current[4] == 0) {
      if(FilterData.isOutlier(averageDuck, stdDuck, current) == false) {
        filteredDuckData.push(current);
      }
    }
    else {
      console.log("Error:OUTLIER REMOVAL, target is neither 1 nor 0");
    }
  }

  console.log("\n\nNum Filtered Jump Data Points: " + filteredJumpData.length);
  console.log("\n\nNum Filtered Duck Data Points: " + filteredDuckData.length);

  var finalFilteredData = [];
  //Generate NORM data points
  for(var i = 0; i < FilterData.numInstancesEach; i++) {
    var dataPoint = [1.0,0,0,1.0,0.5];
    finalFilteredData.push(dataPoint);
  }

  //Add Jump data points
  for(var i = 0; i < FilterData.numInstancesEach ; i++) {
    var index = Math.floor(Math.random()*filteredJumpData.length);
    finalFilteredData.push(filteredJumpData[index]);
  }

  //Add Duck data points
  for(var i = 0; i < FilterData.numInstancesEach ; i++) {
    var index = Math.floor(Math.random()*filteredDuckData.length);
    finalFilteredData.push(filteredDuckData[index]);
  }

  console.log("\n\nNum final filtered Data points: " + finalFilteredData.length);

  var fileName =FilterData.dataDirectory+'/'+FilterData.fileNamePrefix;
  fileName = fileName + Date.now()+'__'+finalFilteredData.length+'.json';
  fs.writeFile(fileName, JSON.stringify(finalFilteredData), function (err){
    if (err) {
      UI.logger.log('Failed to save filteredData! '+err);
    } else {
      UI.logger.log('FileredData Saved to '+fileName);
    }
    // UI.refreshFiles();
  });
}

module.exports = FilterData;
