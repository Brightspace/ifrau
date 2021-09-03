export function clientSyncTimezone(client) {
	return client.request('timezone').then(timezone => {
		const htmlElems = document.getElementsByTagName('html');
		if (htmlElems.length === 1) {
			htmlElems[0].setAttribute(
				'data-timezone',
				JSON.stringify(timezone)
			);
		}
	});
}
