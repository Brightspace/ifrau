function installClientPolling(sync) {
	let title = '';

	setInterval(() => {
		const newTitle = document.title;
		if (newTitle !== title) {
			title = newTitle;
			sync(title);
		}
	}, 100);

}

function installClientMutation(sync) {
	let elem = document.querySelector('title');
	if (elem === null) {
		elem = document.createElement('title');
		document.getElementsByTagName('head')[0].appendChild(elem);
	}
	sync(document.title);

	const observer = new window.MutationObserver((mutations) => {
		sync(mutations[0].target.textContent);
	});
	observer.observe(
		elem,
		{ subtree: true, characterData: true, childList: true }
	);

}

export function clientSyncTitle(syncPage) {
	const clientSyncTitle = client => {
		const sync = value => {
			if (syncPage === false) client.sendEvent('title', value, true);
			else client.sendEvent('title', value, false);
		};

		if ('MutationObserver' in window) installClientMutation(sync);
		else installClientPolling(sync);
	};
	return clientSyncTitle;
}
