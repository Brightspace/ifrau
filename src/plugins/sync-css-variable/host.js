'use strict';

module.exports = function hostSyncCssVariable(host) {
	host.onRequest('css-variable', function() {
		var htmlElems = document.getElementsByTagName('html');
		if (htmlElems.length === 1 && htmlElems[0].hasAttribute('data-css-vars')) {
			try {
				return JSON.parse(
					htmlElems[0].getAttribute('data-css-vars')
				);
			} catch (e) {}
		}
		return {};
	});
};
