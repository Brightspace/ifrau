'use strict';

module.exports = function clientSyncFont(client) {
	return client.request('font').then(function(font) {
		if (font.visualRedesign) {
			document.documentElement.style.fontSize = font.size;
			if (font.dyslexic) {
				document.body.classList.add('vui-dyslexic');
			}
		} else {
			document.body.style.fontFamily = font.family;
			document.body.style.fontSize = font.size;
		}
	});
};
