'use strict';

module.exports = function clientSyncFont(client) {
	return client.request('font').then(function(font) {
		var size = font.size;
		if (!font.visualRedesign) {
			switch (font.size) {
				case '17.1px':
					size = '18px';
					break;
				case '19px':
					size = '22px';
					break;
				case '22.8px':
					size = '24px';
					break;
				default:
					size = '20px';
					break;
			}
		}
		document.documentElement.style.fontSize = size;
	});
};
