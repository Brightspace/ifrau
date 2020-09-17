module.exports = function clientSyncTimezone(client) {
	return client.request('timezone').then(function(timezone) {
		var htmlElems = document.getElementsByTagName('html');
		if (htmlElems.length === 1) {
			htmlElems[0].setAttribute(
				'data-timezone',
				JSON.stringify(timezone)
			);
		}
	});
};
