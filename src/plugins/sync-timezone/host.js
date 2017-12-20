'use strict';

module.exports = function hostSyncTimezone(host) {
	host.onRequest('timezone', function() {
		var htmlElems = document.getElementsByTagName('html');
		if (htmlElems.length === 1 && htmlElems[0].hasAttribute('data-timezone')) {
			try {
				return JSON.parse(
					htmlElems[0].getAttribute('data-timezone')
				);
			} catch (e) {}
		}
		return {
			identifier: '',
			name: ''
		};
	});
};
