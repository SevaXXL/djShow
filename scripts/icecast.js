/**
 * Child-process - icecast-сервер
 */

var port = 8000;
var needInit = true;

const net = require('net');
const bufferpack = require('./bufferpack');

net.createServer(function (sock) {
	sock.on('data', function (dataChunk) {
		if (needInit) {
			sock.write('HTTP/1.0 200 OK\r\n\r\n');
			needInit = false;
		} else {
			var title = getName('title', dataChunk);
			var artist = getName('artist', dataChunk);
			if (title || artist) {
				process.send('Title: ' + (title || '') + '\nArtist: ' + (artist || ''));
			}
		}
	});
	sock.on('end', function () {
		needInit = true;
	});
}).listen(port, 'localhost');

/**
 * Поиск в Buffer'е
 */
function getName(needle, haystack) {
	// (....)TITLE=(.*) - $1: запакованный размер, $2: содержимое
	needle = needle.toUpperCase() + '=';
	var position = haystack.indexOf(needle);
	if (position != -1) {
		var length = haystack.slice(position - 4, position);
		length = bufferpack.unpack('<l', length);
		return haystack.toString('utf8', position + needle.length, position + length[0]);
	}
}
