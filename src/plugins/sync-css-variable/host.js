'use strict';

module.exports = function hostSyncCssVariable(host) {
	host.onRequest('css-variable', function() {
		var elem  = document.getElementById('d2l-branding-vars');
		if (elem && elem.hasAttribute('data-css-vars')) {
			var data = elem.getAttribute('data-css-vars');
			try {
				var cssVariables = JSON.parse(data);
				return cssVariables;
			} catch (e) {}
		}
		return {};
	});
};
