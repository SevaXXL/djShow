/**
 * Child-process - icecast-сервер
 */

var port = 8000;

const net = require('net');

net.createServer(function (sock) {
	sock.on('data', function (dataChunk) {
		if (dataChunk.indexOf('SOURCE') != -1) {
			sock.write('HTTP/1.0 200 OK\r\n\r\n');
		} else {
			dataChunk = dataChunk.toString();
			var artist = dataChunk.match(/artist=(.+)&/);
			var title = dataChunk.match(/title=(.+) /);
			if (artist) {
				artist = decodeURIComponent(artist[1]);
			} else {
				artist = '';
			}
			if (title) {
				title = decodeURIComponent(title[1]);
			} else {
				title = '';
			}
			process.send('Title: ' + title + '\nArtist: ' + artist);
		}
	});
}).listen(port, 'localhost');
