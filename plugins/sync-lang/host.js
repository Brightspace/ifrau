export function hostSyncLang(host) {
	host.onRequest('lang', () => {
		const htmlElem = document.getElementsByTagName('html')[0];
		const isRtl = (document.dir.toLowerCase() === 'rtl');
		return {
			isRtl: isRtl,
			lang: htmlElem.getAttribute('lang'),
			fallback: htmlElem.getAttribute('data-lang-default')
		};
	});
}
