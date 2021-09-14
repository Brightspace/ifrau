export function clientSyncLang(client) {
	return client.request('lang').then(lang => {
		const htmlElem = document.getElementsByTagName('html')[0];
		htmlElem.setAttribute('lang', lang.lang);
		if (lang.fallback) {
			htmlElem.setAttribute('data-lang-default', lang.fallback);
		}
		if (lang.isRtl) {
			htmlElem.setAttribute('dir', 'rtl');
			document.dir = 'rtl';
		}
	});
}
