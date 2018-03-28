'use strict';

module.exports = function clientSyncCssVariable(client) {
	return client.request('css-variable').then(function(cssVariables) {
		var htmlElem = document.getElementsByTagName('html')[0];
		Object.keys(cssVariables).forEach(function(key) {
			htmlElem.style.setProperty(key, cssVariables[key]);
		});
	});
};
