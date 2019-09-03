'use strict';

function installClientPolling(sync) {

	var title = '';

	setInterval(function() {
		var newTitle = document.title;
		if (newTitle !== title) {
			title = newTitle;
			sync(title);
		}
	}, 100);

}

function installClientMutation(sync) {

	var elem = document.querySelector('title');
	if (elem === null) {
		elem = document.createElement('title');
		document.getElementsByTagName('head')[0].appendChild(elem);
	}
	sync(document.title);

	var observer = new window.MutationObserver(function(mutations) {
		sync(mutations[0].target.textContent);
	});
	observer.observe(
		elem,
		{ subtree: true, characterData: true, childList: true}
	);

}

module.exports = function(syncPage) {
	function clientSyncTitle(client) {

		function sync(value) {
			var title = {
				'syncPage' : syncPage,
				'value' : value
			};
			client.sendEvent('title', title);
		}

		if ('MutationObserver' in window) {
			installClientMutation(sync);
		} else {
			installClientPolling(sync);
		}
	}
	return clientSyncTitle;
};
