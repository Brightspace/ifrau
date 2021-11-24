export function clientSyncFont(client) {
	return client.request('font').then(font => {
		document.documentElement.style.fontSize = font.sizeRoot ?? font.size;
	});
}
