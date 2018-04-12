'use strict';

module.exports = function clientSyncLang(client) {
	return client.request('lang').then(function(lang) {
		var htmlElem = document.getElementsByTagName('html')[0];
		htmlElem.setAttribute('lang', lang.lang);
		if (lang.fallback) {
			htmlElem.setAttribute('data-lang-default', lang.fallback);
		}
		if (lang.isRtl) {
			document.dir = 'rtl';
		}
	});
};
