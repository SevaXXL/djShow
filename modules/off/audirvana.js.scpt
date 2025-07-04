JsOsaDAS1.001.00bplist00�Vscript_�/**
 * Now playing track from Audirvana Studio.app
 */
function run(argv) {
	let previousTrackID;
	const port = argv[0] || 3000;
	const app = Application.currentApplication();
	app.includeStandardAdditions = true;
	while (true) {
		if (Application('System Events').processes['Audirvana Studio'].exists()) {
			const audirvana = Application('Audirvana Studio');
			if (audirvana.playerState() == 'Playing' && audirvana.playingTrackUrl() != previousTrackID) {
				previousTrackID = audirvana.playingTrackUrl();
				const trackData = {
					title: audirvana.playingTrackTitle(),
					artist: audirvana.playingTrackArtist(),
					file: audirvana.playingTrackUrl()
				};
				const jsonData = JSON.stringify({'current': trackData});
				try {
					app.doShellScript(`curl -d "${encodeURI(jsonData)}" -H "Content-Type: application/json" -X POST http://localhost:${port}/data`);
				} catch (e) {
					console.log(e.message);
				}
			}
		}
		delay(4);
	}
}                              �jscr  ��ޭ