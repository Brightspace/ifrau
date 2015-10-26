'use strict';

module.exports.client = function clientSyncFont(client) {
	return client.request('font').then(function(font) {
		document.body.style.fontFamily = font.family;
		document.body.style.fontSize = font.size;
	});
};

module.exports.host = function hostSyncFont(host) {
	host.onRequest('font', function() {
		var computedStyle = window.getComputedStyle(document.body);
		return {
			family: computedStyle.fontFamily,
			size: computedStyle.fontSize
		};
	});
};
