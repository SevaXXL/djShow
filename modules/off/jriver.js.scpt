JsOsaDAS1.001.00bplist00�Vscript_	X/**
 * djShow module for iRiver Media Center
 */
function run(argv) {
	const zone = 0; // ZoneID of jRiver playlist
	const trackURL = 'http://localhost:52199/MCWS/v1/Playback/Info?Zone=' + zone;
	const playlistURL = 'http://localhost:52199/MCWS/v1/Playback/Playlist?Fields=Artist,Genre,Name,Date%20(year)&Zone=' + zone;
	const port = argv[0] || 3000;
	let previousTrackID;
	const app = Application.currentApplication();
	app.includeStandardAdditions = true;

	while (true) {
		let trackInfo;
		let playlist;

		trackInfo = getURL(trackURL);

	    if (trackInfo && getTag('State', trackInfo) == 2) { // State 2 is playing
			const currentTrackID = getTag('FileKey', trackInfo);
			const currentIndex = getTag('PlayingNowPosition', trackInfo);

			if (currentTrackID && currentTrackID !== previousTrackID) { // New song
				previousTrackID = currentTrackID;
				playlist = getURL(playlistURL);
            	playlist = playlist.match(/<Item>([\s\S]*?)<\/Item>/gm); // Separate by songs

				if (playlist) {
					const currentIndex = +getTag('PlayingNowPosition', trackInfo);
					const currentTrack = {
						artist: getTag('Artist', playlist[currentIndex]),
						title: getTag('Name', playlist[currentIndex]),
						genre: getTag('Genre', playlist[currentIndex]),
						year: getTag('Date \\(year\\)', playlist[currentIndex])
					};
					const songs = [];
					for (let i = currentIndex + 1; i < playlist.length; i++) {
						songs.push({
							'artist': getTag('Artist', playlist[i]),
							'genre': getTag('Genre', playlist[i])
						});
						if (songs.length > 8) break;
					}

					const jsonData = JSON.stringify({'current': currentTrack, 'next': songs});
					try {
						app.doShellScript(`curl -d "${encodeURI(jsonData)}" -H "Content-Type: application/json" -X POST http://localhost:${port}/data`);
					} catch (e) {
						console.log(e.message);
					}
				}
			}
		}
		delay(4);
	}


	/**
	 * Fetch URL
	 * @param string url
	 * @return string
	 */
	function getURL(url) {
		const data = $.NSData.dataWithContentsOfURL($.NSURL.URLWithString(url));
		return $.NSString.alloc.initWithDataEncoding(data, $.NSUTF8StringEncoding).js;
	}

	/**
	 * Parce xml
	 * @return String
	 */
	function getTag(needle, haystack) {
		const re = new RegExp('<(Item|Field) Name="' + needle + '">(.+?)<\\/(Item|Field)>');
		const result = haystack.match(re);
		return result ? result[2] : '';
	}


}                              	njscr  ��ޭ