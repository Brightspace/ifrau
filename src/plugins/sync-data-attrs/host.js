module.exports = function hostSyncDataAttrs(host) {
	host.onRequest('attrs', function() {
		var htmlElems = document.getElementsByTagName('html');
		if (htmlElems.length === 1 && htmlElems[0].hasAttributes()) return Object.assign({}, htmlElems[0].dataset);
		return {};
	});
};
