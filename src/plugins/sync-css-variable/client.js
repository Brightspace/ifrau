module.exports = function clientSyncCssVariable(client) {
	return client.request('css-variable').then(function(cssVariables) {
		var htmlElems = document.getElementsByTagName('html');
		if (htmlElems && htmlElems.length === 1) {
			Object.keys(cssVariables).forEach(function(key) {
				htmlElems[0].style.setProperty(key, cssVariables[key]);
			});
		}
	});
};
