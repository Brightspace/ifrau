'use strict';

module.exports = function hostSyncFont(host) {
	host.onRequest('font', function() {
		var computedStyle = window.getComputedStyle(document.body);
		return {
			family: computedStyle.fontFamily,
			size: computedStyle.fontSize
		};
	});
};
