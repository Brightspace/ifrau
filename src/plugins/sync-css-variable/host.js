'use strict';

module.exports = function hostSyncCssVariable(host) {
	host.onRequest('css-variable', function() {
		var elem  = document.getElementById('d2l-branding-vars');
		if (elem) {
			var data = elem.getAttribute('data-css-vars');
			var cssVariables = JSON.parse(data);
			return cssVariables;
		}
		return {};
	});
};
