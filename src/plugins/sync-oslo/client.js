'use strict';

module.exports = function clientSyncOslo(client) {
	return client.request('oslo').then(function(oslo) {
		var htmlElems = document.getElementsByTagName('html');
		if (htmlElems.length === 1 && oslo) {
			htmlElems[0].setAttribute(
				'data-oslo',
				JSON.stringify(oslo)
			);
		}
	});
};
