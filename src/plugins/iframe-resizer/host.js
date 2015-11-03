'use strict';

var iframeResizer = require('iframe-resizer/js/iframeResizer');

module.exports = function resizer(host) {
	var initialized = false;
	host.onEvent('ready', function() {
		if (initialized) {
			return;
		}
		initialized = true;
		iframeResizer(
			{
				log: host.debugEnabled
			},
			host.iframe
		);
	});
	host.onClose(function() {
		if (host.iframe && host.iframe.iFrameResizer) {
			host.iframe.iFrameResizer.close(host.iframe);
		}
	});
};
