JsOsaDAS1.001.00bplist00�Vscript_�/**
 * Now playing track and nex tanda from Swinsian.app
 */
function run(argv) {
	let previousTrackID;
	const port = argv[0] || 3000;
	const app = Application.currentApplication();
	app.includeStandardAdditions = true;
	while (true) {
		if (Application("System Events").processes['Swinsian'].exists()) {
			const swinsian = Application('Swinsian');
			if (swinsian.playerState() == 'playing' && swinsian.currentTrack.id() != previousTrackID) {
				previousTrackID = swinsian.currentTrack.id();
				const trackData = {
					title: swinsian.currentTrack.name(),
					artist: swinsian.currentTrack.artist(),
					genre: swinsian.currentTrack.genre(),
					year: swinsian.currentTrack.year()
				};
				const next = [];
				for (let i = 1; i < swinsian.playbackQueue.tracks.length; i++) {
					if (i > 8) break;
					next.push({
						'artist': swinsian.playbackQueue.tracks[i].artist(),
						'genre': swinsian.playbackQueue.tracks[i].genre()
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
}                              � jscr  ��ޭ