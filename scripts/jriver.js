/**
 * Child-process - jRiver
 */

var http = require('http');
var previousTrackID;


function getTag(needle, haystack) {
  var re = new RegExp('<Item Name="' + needle + '">(.+)<\/Item>');
  var result = haystack.match(re);
  if (result) {
    return result[1];
  } else {
    return '';
  }
}

function mainLoop() {
  http.get('http://127.0.0.1:52199/MCWS/v1/Playback/Info', function(res) {
    if (res.statusCode == 200) {
      res.setEncoding('utf8');
      var data = '';
      res.on('data', function(chunk) {
        data += chunk;
      });
      res.on('end', function() {
        var currentTrack = data;
        if (currentTrack) {
          var currentTrackID = getTag('FileKey', currentTrack);
          if (currentTrackID && currentTrackID !== previousTrackID) {
            previousTrackID = currentTrackID;
            process.send('Title: ' + getTag('Name', currentTrack) + '\nArtist: ' + getTag('Artist', currentTrack));
          }
        }
      });
    }
  }).on('error', function(e) {
    console.log(`Got error: ${e.message}`);
  });
  setTimeout(mainLoop, 8000);
}

mainLoop();
