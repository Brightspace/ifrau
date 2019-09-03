'use strict';

module.exports = function hostSyncTitle(options) {
	options = options || {};
	return function(host) {
		host.onEvent('iframeTitleOnly', function(title) {
			if (host.iframe) {
				host.iframe.title = title;
			}
		});

		host.onEvent('title', function(title) {
			if (options.page) {
				document.title = title;
			}
			if (host.iframe) {
				host.iframe.title = title;
			}
		});
	};
};
