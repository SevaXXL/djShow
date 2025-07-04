JsOsaDAS1.001.00bplist00�Vscript_/**
 * Now playing track and nex tanda from Music.app
 */
function run(argv) {
	let previousTrackID;
	const port = argv[0] || 3000;
	const app = Application.currentApplication();
	app.includeStandardAdditions = true;
	while (true) {
		if (Application('System Events').processes['Music'].exists()) {
			const music = Application('Music');
			if (music.playerState() == 'playing' && music.currentTrack.databaseID() != previousTrackID) {
				previousTrackID = music.currentTrack.databaseID();
				const trackData = {
					title: music.currentTrack.name(),
					artist: music.currentTrack.artist(),
					genre: music.currentTrack.genre(),
					year: music.currentTrack.year()
				};
				const next = [];
				for (let i = music.currentTrack.index(); i < music.currentPlaylist.tracks.length; i++) {
					if (i > music.currentTrack.index() + 7) break;
					next.push({
						'artist': music.currentPlaylist.tracks[i].artist(),
						'genre': music.currentPlaylist.tracks[i].genre()
					});
				}
				const jsonData = JSON.stringify({'current': trackData, 'next': next});
				try {
					app.doShellScript(`curl -d "${encodeURI(jsonData)}" -H "Content-Type: application/json" -X POST http://localhost:${port}/data`);
				} catch (e) {
					console.log(e.message);
				}
				
			}
		}
		delay(4);
	}
}                              "jscr  ��ޭ