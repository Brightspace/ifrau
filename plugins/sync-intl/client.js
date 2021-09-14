export function clientSyncIntl(client) {
	return client.request('intl').then(intl => {
		const htmlElems = document.getElementsByTagName('html');
		if (htmlElems.length === 1) {
			htmlElems[0].setAttribute(
				'data-intl-overrides',
				JSON.stringify(intl)
			);
		}
	});
}
