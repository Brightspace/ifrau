'use strict';

var inherits = require('inherits');

var SlimClient = require('./slim'),
	resizer = require('../plugins/iframe-resizer/client'),
	syncLang = require('../plugins/sync-lang/client'),
	syncIntl = require('../plugins/sync-intl/client'),
	syncTimezone = require('../plugins/sync-timezone/client'),
	syncTitle = require('../plugins/sync-title/client'),
	syncFont = require('../plugins/sync-font/client'),
	syncCssVariable = require('../plugins/sync-css-variable/client'),
	userActivityEvents = require('../plugins/user-activity-events/client');

function Client(options) {
	if (!(this instanceof Client)) {
		return new Client(options);
	}

	options = options || {};

	SlimClient.call(this, options);

	if (options.syncLang !== false) {
		this.use(syncLang);
		this.use(syncIntl);
		this.use(syncTimezone);
	}
	if (options.syncFont) {
		this.use(syncFont);
	}
	if (options.resizeFrame !== false) {
		this.use(resizer(options.resizerOptions));
	}
	if (options.syncCssVariable) {
		this.use(syncCssVariable);
	}
	this.use(userActivityEvents);
	this.use(syncTitle(options.syncTitle));
}
inherits(Client, SlimClient);

module.exports = Client;
