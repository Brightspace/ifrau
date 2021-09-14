export function clientSyncCssVariable(client) {
	return client.request('css-variable').then(cssVariables => {
		const htmlElems = document.getElementsByTagName('html');
		if (htmlElems && htmlElems.length === 1) {
			Object.keys(cssVariables).forEach(key => {
				htmlElems[0].style.setProperty(key, cssVariables[key]);
			});
		}
	});
}
