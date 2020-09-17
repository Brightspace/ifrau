module.exports = function hostSyncTitle(options) {
	options = options || {};
	return function(host) {
		host.onEvent('title', function(title, iframeOnly) {
			if (!iframeOnly && options.page) {
				document.title = title;
			}
			if (host.iframe) {
				host.iframe.title = title;
			}
		});
	};
};
