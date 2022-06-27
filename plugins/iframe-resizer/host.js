export function hostResizer(host) {
	let initialized = false;
	host.onEvent('ready', () => {
		if (initialized) {
			return;
		}

		const resize = () => {
			window.iFrameResize(
				{
					log: host.debugEnabled,
					heightCalculationMethod: 'max'
				},
				host.iframe
			);
		};

		const resizerScript = document.createElement('script');
		resizerScript.src = 'https://s.brightspace.com/lib/iframe-resizer/3.6.6/iframeResizer.min.deumdified.js';
		resizerScript.onload = resize;
		document.head.appendChild(resizerScript);

		initialized = true;
	});
	host.onClose(() => {
		if (host.iframe && host.iframe.iFrameResizer) {
			host.iframe.iFrameResizer.close(host.iframe);
		}
	});
}
