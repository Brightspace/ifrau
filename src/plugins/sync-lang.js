'use strict';

module.exports.client = function clientSyncLang(client) {
	return client.request('lang').then(function(lang) {
		var htmlElem = document.getElementsByTagName('html')[0];
		htmlElem.setAttribute('lang', lang.lang);
		if (lang.fallback) {
			htmlElem.setAttribute('data-lang-default', lang.fallback);
		}
		if (lang.isRtl) {
			document.body.dir = 'rtl';
		}
	});
};

module.exports.host = function hostSyncLang(host) {
	host.onRequest('lang', function() {
		var htmlElem = document.getElementsByTagName('html')[0];
		var isRtl = (document.body.dir.toLowerCase() === 'rtl');
		return {
			isRtl: isRtl,
			lang: htmlElem.getAttribute('lang'),
			fallback: htmlElem.getAttribute('data-lang-default')
		};
	});
};
