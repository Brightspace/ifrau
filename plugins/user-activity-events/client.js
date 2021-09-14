// Call fn immediately, and then don't call again until after timeout has passed
// If it is called one or more times within the timeout, fn is called at the
// trailing edge of the timeout as well, and then re-throttled
function throttle(fn) {
	let called = false;
	let throttled = false;
	const timeout = 10000;

	function maybeCall() {
		if (called && !throttled) {
			called = false;
			throttled = true;
			setTimeout(unthrottled, timeout);
			fn();
		}
	}

	function unthrottled() {
		throttled = false;
		maybeCall();
	}

	return () => {
		called = true;
		maybeCall();
	};
}

export function recordUserEvents(client) {
	const listener = throttle(() => {
		client.sendEvent('userIsActive');
	});

	const opts = { passive: true };
	document.addEventListener('click', listener, opts);
	document.addEventListener('keydown', listener, opts);

	client.onClose(() => {
		document.removeEventListener('click', listener, opts);
		document.removeEventListener('keydown', listener, opts);
	});
}
