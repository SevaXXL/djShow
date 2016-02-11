/**
 * Child-process - Deadbeef now playing
 */

var path = 'deadbeef';
var previousTrackID;

const spawn = require('child_process').spawn;

function getTrackID(callback) {
	var id = spawn(path, ['--nowplaying', '%F']);
	id.stdout.on('data', function (data) {
		callback(data.toString());
	});
}

function getTrackData(callback) {
	var meta = spawn(path, ['--nowplaying', '<artist>%a</artist><title>%t</title>']);
	meta.stdout.on('data', function (data) {
		callback(data.toString());
	});
}

function mainLoop() {
	getTrackID(function (currentTrackID) {
		if (previousTrackID != currentTrackID && currentTrackID != 'nothing') {
			previousTrackID = currentTrackID;
			getTrackData(function (data) {
				process.send(data);
			});
		}
		setTimeout(mainLoop, 4000);
	});
};

mainLoop();
