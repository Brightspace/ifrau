'use strict';

module.exports = function clientSyncFont(client) {
	return client.request('font').then(function(font) {
		document.body.style.fontFamily = font.family;
		document.body.style.fontSize = font.size;
	});
};
