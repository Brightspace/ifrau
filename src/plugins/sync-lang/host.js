module.exports = function hostSyncLang(host) {
	host.onRequest('lang', function() {
		var htmlElem = document.getElementsByTagName('html')[0];
		var isRtl = (document.dir.toLowerCase() === 'rtl');
		return {
			isRtl: isRtl,
			lang: htmlElem.getAttribute('lang'),
			fallback: htmlElem.getAttribute('data-lang-default')
		};
	});
};
