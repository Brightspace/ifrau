'use strict';

// Call fn immediately, and then don't call again until after timeout has passed
// If it is called one or more times within the timeout, fn is called at the
// trailing edge of the timeout as well, and then re-throttled
function throttle(fn) {
	var called = false;
	var throttled = false;
	var timeout = 10000;

	function unthrottled() {
		throttled = false;
		maybeCall();
	}

	function maybeCall() {
		if (called && !throttled) {
			called = false;
			throttled = true;
			setTimeout(unthrottled, timeout);
			fn();
		}
	}

	return function() {
		called = true;
		maybeCall();
	};
}

module.exports = function recordUserEvents(client) {
	if (document.addEventListener) {
		var listener = throttle(function userActivityListener() {
			client.sendEvent('userIsActive');
		});
		document.addEventListener('click', listener);
		document.addEventListener('keydown', listener);

		client.onClose(function removeUserActivityListeners() {
			document.removeEventListener('click', listener);
			document.removeEventListener('keydown', listener);
		});
	}
};
