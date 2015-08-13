export function clientSyncFont(client) {
	return client.request('font').then((font) => {
		document.body.style.fontFamily = font.family;
		document.body.style.fontSize= font.size;
	});
}

export function hostSyncFont(host) {
	host.onRequest('font', () => {
		const computedStyle = window.getComputedStyle(document.body);
		return {
			family: computedStyle.fontFamily,
			size: computedStyle.fontSize
		};
	});
}
