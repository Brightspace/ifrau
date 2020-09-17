'use strict';

var inherits = require('inherits');

var Port = require('./base'),
	RequestTypeError = require('./request-type-error');

var fromError = require('./transform-error').fromError,
	toError = require('./transform-error').toError;

function PortWithRequests() {
	if (!(this instanceof PortWithRequests)) {
		return new PortWithRequests.apply(this, arguments);
	}

	Port.apply(this, arguments);

	this._pendingRequests = {};
	this._requestHandlers = {};
	this._requestCounter = 0;
	this._waitingRequests = [];

	var me = this;
	this._onMessage('req', function() {
		me._receiveRequest.apply(me, arguments);
	});
	this._onMessage('res', function() {
		me._receiveRequestResponse.apply(me, arguments);
	});
}
inherits(PortWithRequests, Port);

PortWithRequests.prototype.request = function request(requestType) {
	var args = new Array(arguments.length - 1);
	for (var i = 1; i < arguments.length; ++i) {
		args[i - 1] = arguments[i];
	}

	var me = this;
	return new Promise(function(resolve, reject) {
		var counter = ++me._requestCounter;
		var id = me._id + '_' + counter;

		me._initHashArrAndPush(me._pendingRequests, requestType, {
			id: id,
			resolve: resolve,
			reject: reject
		});

		function finish() {
			me._sendMessage('req', requestType, {
				id: id,
				args: args
			});
		}

		if (!me._isConnected) {
			me._connectQueue.push(finish);
		} else {
			finish();
		}
	});
};

PortWithRequests.prototype.onRequest = function onRequest(requestType, handler) {
	if (this._isConnected) {
		throw new Error('Add request handlers before connecting');
	}

	if (this._requestHandlers[requestType] !== undefined) {
		throw new Error('Duplicate onRequest handler for type "' + requestType + '"');
	}

	this.debug('onRequest handler added for "' + requestType + '"');

	this._requestHandlers[requestType] = handler;

	// process requests we've received before adding handler, somehow
	this._sendRequestResponse(requestType);

	return this;
};

PortWithRequests.prototype._receiveRequest = function receiveRequest(requestType, payload) {
	this._initHashArrAndPush(this._waitingRequests, requestType, payload);
	this._sendRequestResponse(requestType);
};

PortWithRequests.prototype._sendRequestResponse = function sendRequestResponse(requestType) {
	var handler = this._requestHandlers[requestType];
	var waiting = this._waitingRequests[requestType];
	delete this._waitingRequests[requestType];

	if (waiting === undefined || waiting.length === 0) {
		return;
	}

	var me = this;

	if (handler === undefined) {
		var noHandler = fromError(new RequestTypeError(requestType));
		waiting.forEach(function(w) {
			me._sendMessage('res', requestType, { id: w.id, err: noHandler });
		});
		return;
	}

	waiting.forEach(function(w) {
		Promise
			.resolve()
			.then(function() {
				if (typeof handler === 'function') {
					return handler.apply(handler, w.args);
				}

				// otherwise "handler" is a value / Promise
				return handler;
			})
			.then(function(val) {
				me._sendMessage('res', requestType, { id: w.id, val: val });
			})
			.catch(function(e) {
				var err = fromError(e);

				me._sendMessage('res', requestType, { id: w.id, err: err });
			});
	});
};

PortWithRequests.prototype._receiveRequestResponse = function receiveRequestResponse(requestType, payload) {
	var requests = this._pendingRequests[requestType];
	if (requests === undefined) {
		return;
	}

	// search for the request this response is for
	for (var i = 0; i < requests.length; ++i) {
		var req = requests[i];
		if (req.id !== payload.id) {
			continue;
		}

		if (payload.hasOwnProperty('err')) {
			var error = toError(payload.err);
			req.reject(error);
		} else {
			req.resolve(payload.val);
		}

		requests.splice(i, 1);
		return;
	}
};

module.exports = PortWithRequests;
