JsOsaDAS1.001.00bplist00�Vscript_�/**
 * Now playing track and nex tanda from Embrace.app
 */
function run(argv) {
	let previousTrackID;
	const port = argv[0] || 3000;
	const app = Application.currentApplication();
	app.includeStandardAdditions = true;
	while (true) {
		if (Application("System Events").processes['Embrace'].exists()) {
			const embrace = Application('Embrace');
			if (embrace.playerState() == 'playing' && embrace.currentTrack.id() != previousTrackID) {
				previousTrackID = embrace.currentTrack.id();
				const trackData = {
					title: embrace.currentTrack.title(),
					artist: embrace.currentTrack.artist(),
					genre: embrace.currentTrack.genre(),
					year: embrace.currentTrack.year()
				};
				const next = [];
				for (let i = embrace.currentIndex(); i < embrace.tracks.length; i++) {
					if (i > embrace.currentIndex() + 7) break;
					next.push({
						'artist': embrace.tracks[i].artist(),
						'genre': embrace.tracks[i].genre()
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
}                              �jscr  ��ޭ