/* eslint-disable no-invalid-this */
'use strict';

function throttle(fn) {
	var last, deferTimer;
	return function() {
		var context = this;
		//only fire the event if it has been at least 10 seconds since previous fire
		var threshhold = 10000;
		var now = (new Date()).getTime();
		if (last && now < last + threshhold) {
			// hold on to it
			clearTimeout(deferTimer);
			deferTimer = setTimeout(function() {
				last = now;
				fn.apply(context);
			}, threshhold + last - now);
		} else {
			last = now;
			fn.apply(context);
		}
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
