/**
 * Child-process - Mixxx tags reader
 */

const port = 8000;
const net = require('net');

net.createServer(function (sock) {
	sock.on('data', function (data) {
		if (data.indexOf('SOURCE') != -1) {
			sock.write('HTTP/1.0 200 OK\r\n\r\n');
		} else {
			data = data.toString();
			data = data.match('GET \/admin\/metadata\?(.+) HTTP\/1\.0');
			if (data) {
				data = data[1].split('&');
				var title = '';
				var artist = '';
				for (var i = 0; i < data.length; i++) {
					var tmp = data[i].split('=');
					if (tmp[0] == 'title') {
						title = decodeURIComponent(tmp[1]);
					} else if (tmp[0] == 'artist') {
						artist = decodeURIComponent(tmp[1]);
					}
				};
			}

			process.send('Title: ' + title + '\nArtist: ' + artist);
		}
	});
}).listen(port, 'localhost');