function installClientPolling(sync) {

	let title = '';

	setInterval(() => {
		let newTitle = document.title;
		if(newTitle !== title) {
			title = newTitle;
			sync(title);
		}
	}, 100);

}

function installClientMutation(sync) {

	let elem = document.querySelector('title');
	if(elem === null) {
		elem = document.createElement('title');
		document.getElementsByTagName('head')[0].appendChild(elem);
	}
	sync(document.title);

	const observer = new window.MutationObserver(function(mutations) {
		sync(mutations[0].target.textContent);
	});
	observer.observe(
		elem,
		{ subtree: true, characterData: true, childList: true}
	);

}

function clientSyncTitle(client) {

	function sync(value) {
		client.sendEvent('title', value);
	}

	if('MutationObserver' in window) {
		installClientMutation(sync);
	} else {
		installClientPolling(sync);
	}
}

function hostSyncTitle(options) {
	options = options || {};
	return function(host) {
		host.onEvent('title', function(title) {
			if(options.page) {
				document.title = title;
			}
			if(host.iframe) {
				host.iframe.title = title;
			}
		});
	};
}

export {clientSyncTitle};
export {hostSyncTitle};
