/**
 * Child-process for iTunes
 *
 **/

const spawn = require('child_process').spawn;
var previousTrackID = 0;

function mainLoop() {
    var scriptRunner = spawn('cscript', ['//Nologo', 'itunes.vbs', previousTrackID]);
    scriptRunner.stdout.on('data', function(data) {
        previousTrackID = data.toString();
        // process.send();
    });
    setTimeout(mainLoop, 6000);
};
mainLoop();

