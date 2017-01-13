var keypress = require('keypress');
var fs = require('fs');
var GameManipulator = require('./GameManipulator');

var stdin = process.stdin;
stdin.setRawMode(true);
stdin.resume();
stdin.setEncoding('utf8');

var manualData = [];
var instance = [];
var num_instances = 0;
stdin.on('data', function(key){
    if (key == '\u001B\u005B\u0041') {
        process.stdout.write('up');
        instance.push(GameManipulator.sensors[0].value);
        instance.push(GameManipulator.sensors[0].speed);
        instance.push(GameManipulator.sensors[0].size);
        instance.push(1);
        manualData.push(instance);
        instance = [];
        num_instances++;
    }
    if (key == '\u001B\u005B\u0042') {
        process.stdout.write('down');
        instance.push(GameManipulator.sensors[0].value);
        instance.push(GameManipulator.sensors[0].speed);
        instance.push(GameManipulator.sensors[0].size);
        instance.push(0);
        manualData.push(instance);
        instance = [];
        num_instances++;
    }
    if (key == '\u0003') { process.exit(); }    // ctrl-c

    if(num_instances >= 100)
    {
      //Save the manualData array to a file
    }
});

// fs.readFile('/etc/hosts', 'utf8', function (err,data) {
//   if (err) {
//     return console.log(err);
//   }
//   console.log(data);
// });
