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

		require('iframe-resizer/js/iframeResizer.contentWindow');
	}
	return resizer;
};
