JsOsaDAS1.001.00bplist00�Vscript_�/**
 * Now playing track and nex tanda from Cog.app
 */
function run(argv) {
	let previousTrackID = '';
	const port = argv[0] || 3000;
	const app = Application.currentApplication();
	app.includeStandardAdditions = true;
	while (true) {
		if (Application('System Events').processes['Cog'].exists()) {
			const cog = Application('Cog');
			if (cog.currententry.exists() && cog.currententry.url().toString() !== previousTrackID) {
				previousTrackID = cog.currententry.url().toString();
				const trackData = {
					title: cog.currententry.title(),
					artist: cog.currententry.artist(),
					genre: cog.currententry.genre(),
					year: cog.currententry.year()
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