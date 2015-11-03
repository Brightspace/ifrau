'use strict';

module.exports = function(client) {
	window.iframeResizer = {
		targetOrigin: client._targetOrigin
	};

	require('iframe-resizer/js/iframeResizer.contentWindow');
};
