export function clientSyncLang(client) {
	return client.request('lang').then((lang) => {
		var htmlElem = document.getElementsByTagName('html')[0];
		htmlElem.setAttribute('lang', lang.lang);
		if(lang.fallback) {
			htmlElem.setAttribute('data-lang-default', lang.fallback);
		}
		if(lang.isRtl) {
			document.body.dir = 'rtl';
		}
	});
}

export function hostSyncLang(host) {
	host.onRequest('lang', () => {
		var htmlElem = document.getElementsByTagName('html')[0];
		var isRtl = (document.body.dir.toLowerCase() === 'rtl');
		return {
			isRtl: isRtl,
			lang: htmlElem.getAttribute('lang'),
			fallback: htmlElem.getAttribute('data-lang-default')
		};
	});
}
