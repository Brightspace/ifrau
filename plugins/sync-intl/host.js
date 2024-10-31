export function hostSyncIntl(host) {
	host.onRequest('intl', () => {
		const htmlElems = document.getElementsByTagName('html');
		if (htmlElems.length === 1 && htmlElems[0].hasAttribute('data-intl-overrides')) {
			try {
				return JSON.parse(
					htmlElems[0].getAttribute('data-intl-overrides')
				);
			} catch {}
		}
		return {};
	});
}
