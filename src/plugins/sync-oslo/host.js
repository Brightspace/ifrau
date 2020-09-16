'use strict';

module.exports = function hostSyncOslo(host) {
	host.onRequest('oslo', function() {
		var htmlElems = document.getElementsByTagName('html');
		if (htmlElems.length === 1 && htmlElems[0].hasAttribute('data-oslo')) {
			try {
				var osloData = JSON.parse(
					htmlElems[0].getAttribute('data-oslo')
				);
				osloData.batch = new window.URL(osloData.batch, window.location.origin).href;
				osloData.collection = new window.URL(osloData.collection, window.location.origin).href;

				return osloData;
			} catch (e) {}
		}
		return;
	});
};
