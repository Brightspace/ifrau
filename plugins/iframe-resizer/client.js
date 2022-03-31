export function clientResizer(resizerOptions) {
	const resizer = client => {
		window.iFrameResizer = {
			targetOrigin: client._targetOrigin
		};

		if (resizerOptions) {
			for (const nextKey in resizerOptions) {
				// Avoid bugs when hasOwnProperty is shadowed
				if (Object.prototype.hasOwnProperty.call(resizerOptions, nextKey)) {
					window.iFrameResizer[nextKey] = resizerOptions[nextKey];
				}
			}
		}

		const resizerContentWindow = document.createElement('script');
		resizerContentWindow.src = 'https://s.brightspace.com/lib/iframe-resizer/3.6.6/iframeResizer.contentWindow.min.deumdified.js';
		document.head.appendChild(resizerContentWindow);
	};
	return resizer;
}
