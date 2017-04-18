'use strict';

module.exports = function clientSyncFont(client) {
	return client.request('font').then(function(font) {
		var size = font.size;
		if (!font.visualRedesign) {
			switch (font.size) {
				case '11px':
					size = '18px';
					break;
				case '17px':
					size = '22px';
					break;
				case '26px':
					size = '24px';
					break;
				default:
					size = '20px';
					break;
			}
		}
		document.documentElement.style.fontSize = size;
		document.documentElement.style.fontFamily = font.family;
		if (font.dyslexic) {
			document.body.classList.add('d2l-dyslexic');
		}
	});
};
