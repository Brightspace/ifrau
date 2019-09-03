'use strict';

module.exports = function hostSyncTitle(options) {
	options = options || {};
	return function(host) {
		host.onEvent('title', function(title) {
			if (title.syncPage) {
				if (options.page) {
					document.title = title.value;
				}
			}
			if (host.iframe) {
				host.iframe.title = title.value;
			}
		});
	};
};
