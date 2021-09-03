export function hostSyncDataAttrs(host) {
	host.onRequest('attrs', () => {
		const htmlElems = document.getElementsByTagName('html');
		if (htmlElems.length === 1 && htmlElems[0].hasAttributes()) return Object.assign({}, htmlElems[0].dataset);
		return {};
	});
}
