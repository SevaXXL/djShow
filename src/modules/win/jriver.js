/**
 * jRiver Media Center module for djShow
 */
var zone = 0; // ZoneID of jRiver playlist
var port = 3000; // Port of djShow server
var trackURL = 'http://localhost:52199/MCWS/v1/Playback/Info?Zone=' + zone;
var playlistURL = 'http://localhost:52199/MCWS/v1/Playback/Playlist?Fields=Artist,Genre,Name,Date%20(year)&Zone=' + zone;
var xmlhttp = new ActiveXObject('Microsoft.XMLHTTP');
var previousTrackID;

while (true) {
  var trackInfo;
  var playlist;
  try {
    xmlhttp.open('GET', trackURL, false);
    xmlhttp.onreadystatechange = function() {
      if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
        trackInfo = xmlhttp.responseText;
      }
    };
    xmlhttp.send();
  } catch (error) {
    WScript.StdOut.Write(error.message);
  }

  if (trackInfo && getTag('State', trackInfo) == 2) { // State 2 is playing    
    var currentTrackID = getTag('FileKey', trackInfo);
    if (currentTrackID && currentTrackID !== previousTrackID) { // New song
      previousTrackID = currentTrackID;

      try {
        xmlhttp.open('GET', playlistURL, false);
        xmlhttp.onreadystatechange = function() {
          if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
            playlist = xmlhttp.responseText;
            playlist = playlist.match(/<Item>([\s\S]*?)<\/Item>/gm); // Separate by songs
          }
        };
        xmlhttp.send();
      } catch (error) {
        WScript.StdOut.Write(error.message);
      }

      if (playlist) {
        var currentIndex = +getTag('PlayingNowPosition', trackInfo);
        var currentTrack = {
          artist: getTag('Artist', playlist[currentIndex]),
          title: getTag('Name', playlist[currentIndex]),
          genre: getTag('Genre', playlist[currentIndex]),
          year: getTag('Date \\(year\\)', playlist[currentIndex])
        };
        var songs = [];
        for (var i = currentIndex + 1; i < playlist.length; i++) {
          songs.push({
            'artist': getTag('Artist', playlist[i]),
            'genre': getTag('Genre', playlist[i])
          });
          if (songs.length > 8) break;
        }
        try {
          var message = JSON_stringify({ current: currentTrack, next: songs });
          xmlhttp.open('POST', 'http://localhost:' + port + '/data', false);
          xmlhttp.setRequestHeader('Content-type', 'application/json');
          xmlhttp.send(encodeURI(message));
        } catch (error) {
          WScript.StdOut.Write(error.message);
        }
      } else {
        WScript.StdOut.Write('Error playlist format');
      }
    } // If new song
  } // If is playing
  WScript.Sleep(4000);
}

/**
 * Parce xml
 * @return String
 */
function getTag(needle, haystack) {
  var re = new RegExp('<(Item|Field) Name="' + needle + '">(.+?)<\\/(Item|Field)>');
  var result = haystack.match(re);
  return result ? result[2] : '';
}

/**
 * My JSON_stringify()
 * @return String | undefined
 */
function JSON_stringify (object) {
  if (object === null) {
    return 'null';
  } else if (object === undefined) {
    return undefined;
  } else if (typeof object === 'string') {
    object = object.replace(/\\/g, '\\\\');
    object = object.replace(/"/g, '\\"');
    return '"' + object + '"';
  } else if (typeof object === 'number' || typeof object === 'boolean') {
    return object.toString();
  } else if (object instanceof Array) {
    var result = '[';
    for (var i = 0; i < object.length; i++) {
      result += JSON_stringify(object[i]);
      if (i !== object.length - 1) {
        result += ',';
      }
    }
    result += ']';
    return result;
  } else if (typeof object === 'object') {
    var result = '{';
    var keys = [];
    for (var key in object) {
      keys.push(key);
    } 
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      result += '"' + key + '":' + JSON_stringify(object[key]);
      if (i !== keys.length - 1) {
        result += ',';
      }
    }
    result += '}';
    return result;
  } else {
    return undefined;
  }
};