module.exports = function clientSyncFont(client) {
	return client.request('font').then(function(font) {
		document.documentElement.style.fontSize = font.size;
	});
};
