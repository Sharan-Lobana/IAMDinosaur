var config = require('./config');
var fs = require('fs');
var listOfJsonData = ['sharan_1484519607531__20.json'];

var dataDirectory = config.DATA_DIRECTORY;
for (k in listOfJsonData)
{
  var content = fs.readFileSync(dataDirectory+'/'+listOfJsonData[k]);
  console.log(content.toString());
}
