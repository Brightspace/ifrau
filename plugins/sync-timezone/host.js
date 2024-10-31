export function hostSyncTimezone(host) {
	host.onRequest('timezone', () => {
		const htmlElems = document.getElementsByTagName('html');
		if (htmlElems.length === 1 && htmlElems[0].hasAttribute('data-timezone')) {
			try {
				return JSON.parse(
					htmlElems[0].getAttribute('data-timezone')
				);
			} catch {}
		}
		return {
			identifier: '',
			name: ''
		};
	});
}
