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
		document.addEventListener('click', throttle(function() {
			client.sendEvent('userIsActive');
		}));
		document.addEventListener('keydown', throttle(function() {
			client.sendEvent('userIsActive');
		}));
	}
};
