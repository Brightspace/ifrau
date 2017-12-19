'use strict';

module.exports = function hostSyncIntl(host) {
	host.onRequest('intl', function() {
		var htmlElems = document.getElementsByTagName('html');
		if (htmlElems.length === 1 && htmlElems[0].hasAttribute('data-intl-overrides')) {
			try {
				return JSON.parse(
					htmlElems[0].getAttribute('data-intl-overrides')
				);
			} catch (e) {}
		}
		return {};
	});
};
