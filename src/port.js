'use strict';

var Promise = require('lie'),
	uuid = require('uuid');

var fromError = require('./transform-error').fromError,
	toError = require('./transform-error').toError;

var typeNameValidator = /^[a-zA-Z]+[a-zA-Z\-]*$/;

function Port(endpoint, targetOrigin, options) {
	if (!(this instanceof Port)) {
		return new Port(endpoint, targetOrigin, options);
	}

	options = options || {};
	this._connectQueue = [];
	this._debugEnabled = options.debug || false;
	this._endpoint = endpoint;
	this._eventHandlers = {};
	this._isConnected = false;
	this._isOpen = false;
	this._onCloseCallbacks = [];
	this._pendingRequests = {};
	this._requestHandlers = {};
	this._services = {};
	this._targetOrigin = targetOrigin;
	this._waitingRequests = [];

	this._id = uuid();
	this._requestCounter = 0;
}

Port.prototype.close = function close() {
	if(!this._isOpen) {
		throw new Error('Port cannot be closed, call open() first');
	}
	this._isOpen = false;
	this._isConnected = false;
	window.removeEventListener('message', this._receiveMessage);
	this._onCloseCallbacks.forEach(function (cb) { cb(); });
	this.debug('closed');
};

Port.prototype.connect = function connect() {
	this._isConnected = true;
	this.debug('connected');
	this._connectQueue.forEach(function (func) { func(); });
	this._connectQueue = [];
	return this;
};

Port.prototype.debug = function debug(msg) {
	if(this._debugEnabled) {
		console.log(msg);
	}
};

Port.prototype.getService = function getService(serviceType, version) {
	if(!this._isConnected) {
		throw new Error('Cannot getService() before connect() has completed');
	}
	var serviceVersionPrefix = 'service:' + serviceType + ':' + version;
	var me = this;
	function createProxyMethod(name) {
		return function() {
			var args = [serviceVersionPrefix + ':' + name];
			for(var i=0; i<arguments.length; i++) {
				args.push(arguments[i]);
			}
			return me.request.apply(me, args);
		};
	}
	function createProxy(methodNames) {
		var proxy = {};
		methodNames.forEach(function(name) {
			proxy[name] = createProxyMethod(name);
		});
		return proxy;
	}
	return me.request(serviceVersionPrefix).then(createProxy);
};

Port.prototype._initHashArrAndPush = function initHashArrAndPush(dic, key, obj) {
	if(dic[key] === undefined ) {
		dic[key] = [];
	}
	dic[key].push(obj);
};

Port.prototype.onClose = function onClose(cb) {
	this._onCloseCallbacks.push(cb);
};

Port.prototype.onEvent = function onEvent(eventType, handler) {
	this.debug('onEvent handler added for "' + eventType + '"');
	if(this._isConnected) {
		this.debug('You\'ve attached event handlers after connecting, you may have missed some events');
	}
	this._initHashArrAndPush(this._eventHandlers, eventType, handler);
	return this;
};

Port.prototype.onRequest = function onRequest(requestType, handler) {
	if(this._isConnected) {
		throw new Error('Add request handlers before connecting');
	}
	if(this._requestHandlers[requestType] !== undefined) {
		throw new Error('Duplicate onRequest handler for type "' + requestType + '"');
	}
	this.debug('onRequest handler added for "' + requestType + '"');
	this._requestHandlers[requestType] = handler;
	this._sendRequestResponse(requestType);
	return this;
};

Port.prototype.open = function open() {
	if(this._isOpen) {
		throw new Error('Port is already open.');
	}
	this._isOpen = true;
	window.addEventListener('message', this._receiveMessage.bind(this), false);
	this.debug('opened');
	return this;
};

Port.prototype._receiveMessage = function receiveMessage(e) {
	if(!Port._validateEvent(this._targetOrigin, this._endpoint, e)) {
		return;
	}

	var messageType = e.data.key.substr(5,3);
	var subType = e.data.key.substr(9);

	this.debug('received ' + messageType + '.' + subType);

	if(messageType === 'evt') {
		this._receiveEvent(subType, e.data.payload);
	} else if(messageType === 'req') {
		this._receiveRequest(subType, e.data.payload);
	} else if(messageType === 'res') {
		this._receiveRequestResponse(subType, e.data.payload);
	}
};

Port.prototype._receiveEvent = function receiveEvent(eventType, payload) {
	if(this._eventHandlers[eventType] === undefined) {
		return;
	}
	this._eventHandlers[eventType].forEach(function(handler) {
		handler.apply(handler, payload);
	});
};

Port.prototype._receiveRequest = function receiveRequest(requestType, payload) {
	this._initHashArrAndPush(this._waitingRequests, requestType, payload);
	this._sendRequestResponse(requestType);
};

Port.prototype._receiveRequestResponse = function receiveRequestResponse(requestType, payload) {
	var requests = this._pendingRequests[requestType];
	if(requests === undefined) {
		return;
	}

	for(var i=0; i<requests.length; i++) {
		var req = requests[i];
		if(req.id !== payload.id) {
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

Port.prototype.registerService = function registerService(serviceType, version, service) {
	if(this._isConnected) {
		throw new Error('Register services before connecting');
	}
	if(!typeNameValidator.test(serviceType)) {
		throw new Error('Invalid service type "' + serviceType + '"');
	}
	var methodNames = [];
	for(var p in service) {
		if(typeof(service[p]) === 'function') {
			methodNames.push(p);
			this.onRequest('service:' + serviceType + ':' + version + ':' + p, service[p]);
		}
	}
	this.onRequest('service:' + serviceType + ':' + version, methodNames);
	return this;
};

Port.prototype.request = function request(requestType) {
	var args = [];
	for(var i=1; i<arguments.length; i++) {
		args.push(arguments[i]);
	}
	var me = this;
	return new Promise(function(resolve, reject) {
		var counter = ++me._requestCounter;
		var id = me._id + '_' + counter;
		me._initHashArrAndPush(
				me._pendingRequests,
				requestType,
				{
					id: id,
					resolve: resolve,
					reject: reject
				}
			);
		function finish() {
			me.sendMessage('req.' + requestType,{id: id, args: args});
		}
		if(!me._isConnected) {
			me._connectQueue.push(finish);
		} else {
			finish();
		}
	});
};

Port.prototype.sendMessage = function sendMessage(key, data) {
	var message = {
		key: 'frau.' + key,
		payload: data
	};
	this.debug('sending key: ' + key);
	this._endpoint.postMessage(message, this._targetOrigin);
	return this;
};

Port.prototype.sendEvent = function sendEvent(eventType) {
	var args = [];
	for(var i=1; i<arguments.length; i++) {
		args.push(arguments[i]);
	}
	if(!this._isConnected) {
		var me = this;
		this._connectQueue.push(function() {
			me.sendMessage('evt.' + eventType, args);
		});
		return this;
	}
	return this.sendMessage('evt.' + eventType, args);
};

Port.prototype._sendRequestResponse = function sendRequestResponse(requestType) {

	var handler = this._requestHandlers[requestType];
	var waiting = this._waitingRequests[requestType];
	delete this._waitingRequests[requestType];

	if(handler === undefined || waiting === undefined || waiting.length === 0) {
		return;
	}

	var me = this;

	waiting.forEach(function(w) {
		Promise
			.resolve()
			.then(function() {
				if (typeof(handler) === 'function') {
					return handler.apply(handler, w.args);
				}

				// otherwise "handler" is a value / Promise
				return handler;
			})
			.then(function (val) {
				me.sendMessage('res.' + requestType, { id: w.id, val: val });
			})
			.catch(function (e) {
				var err = fromError(e);

				me.sendMessage('res.' + requestType, { id: w.id, err: err });
			});
	});

};

Port.prototype.use = function use(fn) {
	fn(this);
	return this;
};

Port._isStringEmpty = function isStringEmpty(str) {
	return (!str || 0 === str.length);
};

Port._validateEvent = function validateEvent(targetOrigin, endpoint, e) {
	var isValid = (e.source === endpoint) &&
	  (targetOrigin === '*' || !Port._isStringEmpty(targetOrigin) && !Port._isStringEmpty(e.origin) && targetOrigin.toUpperCase() === e.origin.toUpperCase()) &&
		(e.data.key !== undefined) &&
		(e.data.key !== null) &&
		(e.data.key.indexOf('frau.') === 0);
	return isValid;
};

module.exports = Port;
