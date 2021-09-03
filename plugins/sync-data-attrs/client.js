const excludedAttrs = [
	'intlOverrides',
	'langDefault',
	'oslo',
	'timezone'
];

export function clientSyncDataAttrs(client) {
	return client.request('attrs').then(dataAttrs => {
		const htmlElems = document.getElementsByTagName('html');
		if (htmlElems.length === 1 && dataAttrs && Object.keys(dataAttrs).length > 0) {
			for (const attrName in dataAttrs) {
				// Omit data attributes already handled by other plugins
				if (!excludedAttrs.includes(attrName)) htmlElems[0].dataset[attrName] = dataAttrs[attrName];
			}
		}
	});
}
