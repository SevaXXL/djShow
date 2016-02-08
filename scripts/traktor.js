const fs = require('fs');
const net = require('net');
const bufferpack = require('./bufferpack');

var needInit = true;
var datafile = __dirname + '/' + 'NowPlaying.txt';

net.createServer(function (sock) {
	sock.on('data', function (dataChunk) {
		if (needInit) {
			sock.write('HTTP/1.0 200 OK\r\n\r\n');
			console.log('Conected');
			needInit = false;
		} else {
			var title = getName('title', dataChunk);
			var artist = getName('artist', dataChunk);
			if (title || artist) {
				fs.writeFile(datafile, 'Title: ' + (title || '') + '\nArtist: ' + (artist || ''), function () {
					console.log(artist + ' - ' + title);
				});
			}
		}
	});
	sock.on('end', function () {
		needInit = true;
		console.log('Disconected. Ready to connect');
	});
}).listen(8000, 'localhost', function () {
	console.log('Ready to connect\nCtrl+C to exit...');
});

/**
 * Search in Buffer
 */
function getName(needle, haystack) {
	// (....)TITLE=(.*) - $1: размер, $2: значение
	needle = needle.toUpperCase() + '=';
	var position = haystack.indexOf(needle);
	if (position != -1) {
		var length = haystack.slice(position - 4, position);
		length = bufferpack.unpack('<l', length);
		return haystack.toString('utf8', position + needle.length, position + length[0]);
	}
}
