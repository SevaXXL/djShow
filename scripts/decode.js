/**
 * Child-process - decode
 */

const fs = require('fs');
const iconv = require('./iconv-lite/lib/index');

var datafile = __dirname + '/' + 'decode.txt',
	encoding  = 'win1251';

/**
 * Реагируем на изменение datafile
 */
fs.watchFile(datafile, function (curr, prev) {
	if (curr.mtime.getTime() !== prev.mtime.getTime()) {
		fs.createReadStream(datafile).pipe(iconv.decodeStream(encoding)).collect(function (err, data) {
			process.send(data);
		});
	}
});