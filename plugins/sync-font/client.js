export function clientSyncFont(client) {
	return client.request('font').then(font => {
		document.documentElement.style.fontSize = font.size;
	});
}
