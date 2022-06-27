export function hostSyncTitle(options) {
	options = options || {};
	return host => {
		host.onEvent('title', (title, iframeOnly) => {
			if (!iframeOnly && options.page) {
				document.title = title;
			}
			if (host.iframe) {
				host.iframe.title = title;
			}
		});
	};
}
