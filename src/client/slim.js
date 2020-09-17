var inherits = require('inherits');

var Port = require('../port');

function SlimClient(options) {
	if (!(this instanceof SlimClient)) {
		return new SlimClient(options);
	}

	options = options || {};

	Port.call(this, window.parent, '*', options);
}
inherits(SlimClient, Port);

SlimClient.prototype.connect = function connect() {
	var me = this;

	return new Promise(function(resolve/*, reject*/) {
		me.open();
		me._sendMessage('evt', 'ready');

		resolve(Port.prototype.connect.call(me));
	});
};

module.exports = SlimClient;
