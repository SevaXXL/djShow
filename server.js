/**
 *  Copyright (C) 2015-2018 Aleksandr Deinega <adeinega@mail.ru>
 *
 *  This file is part of djShow.
 *
 *  djShow is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  djShow is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with djShow. If not, see <http://www.gnu.org/licenses/>.
 */

var version = '2.6.0';

var fs    = require('fs');
var http  = require('http');
var path  = require('path');
var parse = require('url').parse;
var net   = require('os').networkInterfaces();
var port  = 80;
var data  = {};
var users = [];
var child = [];
var fork;
var datafile = __dirname + path.sep + 'NowPlaying.txt';

/**
 * Начальные данные берем из файла datafile
 * и стартуем сервер
 */
fs.readFile(datafile, 'utf8', function(error, newData) {
  if (error) {
    console.log(error);
  } else {
    data = { current: newData };
    /**
     * Сервер
     */
    http.createServer(function (request, response) {
      request.on('end', function () {
        if ('/event' === request.url) {
          sendSSE(request, response);
        } else {
          if ('/' === request.url) request.url = '/index.html';
          sendFile(request, response);
        }
      }).resume();
    }).listen(port, function () {
      var adress = getIP() + ((port == 80) ? '' : ':' + port);
      console.log('*** djShow *** running at http://' + adress + '\nCtrl+C to exit...');
    });
  }
});

/**
 * Обрабатываем дополнительно переданные параметры
 * node server.js param param ... param
 */
for (var i = 2; i < process.argv.length; i++) {
  if (/^\d+$/.test(process.argv[i])) {
    port = +process.argv[i];
  } else {
    console.log('Include ' + process.argv[i]);
    fork = fork || require('child_process').fork;
    child[i] = fork(__dirname + path.sep + process.argv[i]);
    child[i].on('message', function(newData) {
      updateData(newData);
      sendData();
    });
  }
}

/**
 * Реагируем на изменение datafile
 */
fs.watchFile(datafile, function (curr, prev) {
  if (curr.mtime.getTime() !== prev.mtime.getTime()) {
    fs.readFile(datafile, 'utf8', function(error, newData) {
      if (error) {
        console.log(error);
        newData = 'Title: *';
      }
      updateData(newData);
      sendData();
    });
  }
});

/**
 * Обновление данных
 * @param string newdata
 */
function updateData(newData) {
  data = {
    previous: data.current,
    current: newData
  };
}

/**
 * Server Side Events (SSE)
 * @param object request
 * @param object response
 */
function sendSSE(request, response) {
  var username = users.length;
  users[username] = response;
  request.socket.setTimeout(10 * 60 * 1000);
  response.writeHead(200, {
    'Content-Type' : 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection'   : 'keep-alive'
  });
  response.write('retry: 5000\n');
  sendData(username);
  request.on('close', function () {
    users[username].end();
    delete users[username];
  });
}

/**
 * Посылаем данные SSE
 * @param integer username - идентификатор SSE-сессии
 */
function sendData(username) {
  var message = 'data: ' + JSON.stringify(data) + '\n\n';
  message = Buffer.from(message, 'utf8');
  if (typeof username === 'undefined') {
    users.forEach(function (user) {
      user.write(message);
    });
  } else {
    users[username].write(message);
  }
}

/**
 * Отдаем статику
 * @param object request
 * @param object response
 */
function sendFile(request, response) {
  request.url = path.normalize(parse(request.url).pathname);
  var filename = __dirname + request.url;
  fs.stat(filename, function (error, stat) {
    response.setHeader('Server', 'djShow/' + version);    
    if (error) {
      if ('ENOENT' === error.code) {
        response.statusCode = 404;
        response.end('Not Found');
      } else {
        response.statusCode = 500;
        response.end('Internal Server Error');
      }
    } else {
      var clientETag  = request.headers['if-none-match'],
        clientMTime = Date.parse(request.headers['if-modified-since']),
        mtime       = Date.parse(stat.mtime),
        etag        = JSON.stringify([stat.ino, stat.size, mtime].join('-'));

      if ((clientMTime  || clientETag) &&
        (!clientETag  || clientETag === etag) &&
        (!clientMTime || clientMTime >= mtime)) {
        response.statusCode = 304;  
        response.end();
      } else {
        response.setHeader('Etag', etag);
        response.setHeader('Cache-Control', 'max-age=3600');
        response.setHeader('Last-Modified', new (Date)(stat.mtime).toUTCString());
        response.setHeader('Content-Length', stat.size);
        response.setHeader('Content-Type', getMimeType(request.url));
        var stream = fs.createReadStream(filename);
        stream.pipe(response);
        stream.on('error', function () {
          response.statusCode = 500;
          response.end('Internal Server Error');
        });
      }
    }
  });
}

/**
 * Определение mime-type файла
 * @param string url
 * return string
 */
function getMimeType(url) {
  var mimeType = {
    '.appcache': 'text/cache-manifest',
    '.css'     : 'text/css',
    '.ico'     : 'image/x-icon',
    '.gif'     : 'image/gif',
    '.jpg'     : 'image/jpeg',
    '.js'      : 'application/javascript',
    '.json'    : 'application/json',
    '.manifest': 'text/cache-manifest',
    '.png'     : 'image/png',
    '.txt'     : 'text/plain'
  };
  var ext = path.extname(url).toLowerCase();
  return (ext in mimeType) ? mimeType[ext] : 'text/html';
}

/**
 * Определение собственного IP
 * return string || undefined
 */
function getIP() {
  for (var key in net) {
    var item = net[key];
    for (var k in item) {
      if (item[k].family === 'IPv4' && !item[k].internal) {
        return item[k].address;
      }
    }
  }
  return '127.0.0.1';
}
