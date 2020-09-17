module.exports = function clientSyncIntl(client) {
	return client.request('intl').then(function(intl) {
		var htmlElems = document.getElementsByTagName('html');
		if (htmlElems.length === 1) {
			htmlElems[0].setAttribute(
				'data-intl-overrides',
				JSON.stringify(intl)
			);
		}
	});
};
