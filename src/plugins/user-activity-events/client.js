'use strict';

var getPassive = function() {
	var supported = false;
	var options = Object.defineProperty({}, 'passive', {
		get: function() { supported = true; }
	});
	try {
		document.addEventListener('test', null, options);
	} catch (e) { /**/ }

	getPassive = supported
		? function() { return { passive: true }; }
		: function() { return false; };

	return getPassive();
};

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
	var listener = throttle(function userActivityListener() {
		client.sendEvent('userIsActive');
	});

	var opts = getPassive();
	document.addEventListener('click', listener, opts);
	document.addEventListener('keydown', listener, opts);

	client.onClose(function removeUserActivityListeners() {
		document.removeEventListener('click', listener, opts);
		document.removeEventListener('keydown', listener, opts);
	});
};
