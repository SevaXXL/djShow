/**
 * Child-process - Save playlist
 * Скрипт при смене трека дописывает название и антиста в конец файла playlist.txt
 */

const http = require('http');
const fs = require('fs');

/**
 * Запрос не закрывает соединение
 */
http.get({
	hostname: 'localhost',
	port: 80,
	path: '/event'
}, (responce) => {
	responce.on('data', (data) => {
		// Обрабатываем пакеты Server Side Events
		// Сообщение с данными начинается с data:...
		var message = 'data:';
		if (data.indexOf(message) === 0) {
			data = JSON.parse(data.toString('utf8', message.length));
			data = getName('artist', data.current) + ' - ' + getName('title', data.current) + '\n';
			fs.appendFile(__dirname + '/' + 'playlist.txt', data);
		}
	});
});

/**
 * Поиск элемента в тексте по шаблону
 * @param string needle - искомый элемент
 * @param string haystack - текст, в котором осуществляется поиск
 * return string || undefined - найденное значение
 */
var getName = (needle, haystack) => {
	var regmatch,
		result,
		template = [
		'%s: (.+)',
		'<%s>(.+)<\/%s>'
	];
	if (typeof haystack === 'string') {
		for (var i = 0; i < template.length; i++) {
			template[i] = template[i].replace(/%s/g, needle);
			regmatch = new RegExp(template[i], 'i');
			result = haystack.match(regmatch);
			if (result) {
				return result[1];
			}
		}
	}
};