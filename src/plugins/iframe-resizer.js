'use strict';

var iframeResizer = require('iframe-resizer');

module.exports.host = function resizer(host) {
	var initialized = false;
	host.onEvent('ready', function() {
		if (initialized) {
			return;
		}
		initialized = true;
		iframeResizer.iframeResizer(
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
