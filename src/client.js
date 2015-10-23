'use strict';

var inherits = require('inherits'),
	Promise = require('lie');

var Port = require('./port'),
	syncLang = require('./plugins/sync-lang').client,
	syncTitle = require('./plugins/sync-title').client,
	syncFont = require('./plugins/sync-font').client;

function Client (options) {
	if (!(this instanceof Client)) {
		return new Client(options);
	}

	options = options || {};

	Port.call(this, window.parent, '*', options);

	if(options.syncLang) {
		this.use(syncLang);
	}
	if(options.syncTitle !== false) {
		this.use(syncTitle);
	}
	if(options.syncFont) {
		this.use(syncFont);
	}
}
inherits(Client, Port);

Client.prototype.connect = function connect() {
	var me = this;

	return new Promise(function(resolve/*, reject*/) {
		me.open();
		me.sendMessage('evt.ready');

		Port.prototype.connect.call(me);

		resolve(me);
	});
};

Client.prototype.navigate = function navigate(url) {
	this.sendEvent('navigate', url);
};

module.exports = Client;
