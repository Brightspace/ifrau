'use strict';

module.exports = function(resizerOptions) {
	function resizer(client) {
		window.iFrameResizer = {
			targetOrigin: client._targetOrigin
		};

		if (resizerOptions) {
			for (var nextKey in resizerOptions) {
				// Avoid bugs when hasOwnProperty is shadowed
				if (Object.prototype.hasOwnProperty.call(resizerOptions, nextKey)) {
					window.iFrameResizer[nextKey] = resizerOptions[nextKey];
				}
			}
		}

		var resizerContentWindow = document.createElement('script');
		resizerContentWindow.src = 'https://s.brightspace.com/lib/iframe-resizer/3.6.5/iframeResizer.contentWindow.js';
		document.head.appendChild(resizerContentWindow);
	}
	return resizer;
};
