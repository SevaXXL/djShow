/**
 * Child-process - Save playlist
 * Скрипт при смене трека дописывает данные в конец файла playlist.txt
 */

const port = 8888;
const http = require('http');
const path = require('path');
const fs   = require('fs');
const filename = __dirname + path.sep + 'playlist.txt';

fs.appendFile(filename, '\n***** ' + new Date() + ' *****\n', (error) => {
  if (error) throw error;
});

/**
 * Запрос к локальному серверу, порт должен соответствовать порту сервера
 */
http.get({
  hostname: 'localhost',
  port: port,
  path: '/event'
}, (responce) => {
  responce.on('data', (data) => {
    // Обрабатываем пакеты Server Side Events
    // Сообщение с данными начинается с data:...
    var messageName = 'data:';
    if (data.indexOf(messageName) === 0) {
      data = JSON.parse(data.toString('utf8', messageName.length));
      var genre  = getName('genre', data.current);
      var artist = getName('artist', data.current) || '* * *';
      var title  = getName('title', data.current) || '* * *';
      genre = (genre) ? genre + ' - ' : '';
      artist = artist.split(' - ');
      if (artist[1]) {
        artist = artist[0] + ' (' + artist[1] + ')';
      } else {
        artist = artist[0];
      }
      fs.appendFile(filename, genre + artist + ' - ' + title + '\n', (error) => {
        if (error) throw error;
      });
    }
  });
});

/**
 * Поиск элемента в тексте по шаблону
 * @param string needle - искомый элемент
 * @param string haystack - текст, в котором осуществляется поиск
 * return string || undefined - найденное значение
 */
function getName(needle, haystack) {
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
}