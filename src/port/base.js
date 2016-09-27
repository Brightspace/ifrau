'use strict';

var uuid = require('uuid');

var validateEvent = require('./validate-event');

function Port(endpoint, targetOrigin, options) {
	if (!(this instanceof Port)) {
		return new Port(endpoint, targetOrigin, options);
	}

	options = options || {};
	this._connectQueue = [];
	this._pluginStartupValues = [];
	this._debugEnabled = options.debug || false;
	this._endpoint = endpoint;
	this._eventHandlers = {};
	this._isConnected = false;
	this._isOpen = false;
	this._messageHandlers = {};
	this._onCloseCallbacks = [];
	this._targetOrigin = targetOrigin;

	this._id = uuid();

	var me = this;
	this._onMessage('evt', function() {
		me._receiveEvent.apply(me, arguments);
	});
}

Port.prototype.close = function close() {
	if (!this._isOpen) {
		throw new Error('Port cannot be closed, call open() first');
	}
	this._isOpen = false;
	this._isConnected = false;
	window.removeEventListener('message', this._receiveMessage);
	this._onCloseCallbacks.forEach(function(cb) { cb(); });
	this.debug('closed');
};

Port.prototype.connect = function connect() {
	var self = this;

	this._isConnected = true;
	this.debug('connected');
	this._connectQueue.forEach(function(func) { func(); });
	this._connectQueue = [];
	return Promise
		.all(this._pluginStartupValues)
		.then(function() {
			self._pluginStartupValues = null;

			return self;
		});
};

Port.prototype.debug = function debug(msg) {
	if (this._debugEnabled) {
		/* eslint-disable no-console */
		console.log(msg);
	}
};

Port.prototype._initHashArrAndPush = function initHashArrAndPush(dic, key, obj) {
	if (dic[key] === undefined ) {
		dic[key] = [];
	}
	dic[key].push(obj);
};

Port.prototype.onClose = function onClose(cb) {
	this._onCloseCallbacks.push(cb);
};

Port.prototype.onEvent = function onEvent(eventType, handler) {
	this.debug('onEvent handler added for "' + eventType + '"');
	if (this._isConnected) {
		this.debug('You\'ve attached event handlers after connecting, you may have missed some events');
	}
	this._initHashArrAndPush(this._eventHandlers, eventType, handler);
	return this;
};

Port.prototype.open = function open() {
	if (this._isOpen) {
		throw new Error('Port is already open.');
	}
	this._isOpen = true;
	window.addEventListener('message', this._receiveMessage.bind(this), false);
	this.debug('opened');
	return this;
};

Port.prototype._receiveMessage = function receiveMessage(e) {
	if (!validateEvent(this._targetOrigin, this._endpoint, e)) {
		return;
	}

	var clazz = e.data.key.substr(5, 3);
	var key = e.data.key.substr(9);

	this.debug('received ' + clazz + '.' + key);

	var handler = this._messageHandlers[clazz];
	if (handler) {
		handler.call(this, key, e.data.payload);
	}
};

Port.prototype._onMessage = function onMessage(clazz, handler) {
	if (clazz.length !== 3) {
		throw new Error('message class name must be 3 characters');
	}

	this._messageHandlers[clazz] = handler;
};

Port.prototype._receiveEvent = function receiveEvent(eventType, payload) {
	if (this._eventHandlers[eventType] === undefined) {
		return;
	}
	this._eventHandlers[eventType].forEach(function(handler) {
		handler.apply(handler, payload);
	});
};

Port.prototype._sendMessage = function sendMessage(clazz, key, data) {
	var message = {
		key: 'frau.' + clazz + '.' + key,
		payload: data
	};
	this.debug('sending key: ' + message.key);
	this._endpoint.postMessage(message, this._targetOrigin);
	return this;
};

Port.prototype.sendEvent = function sendEvent(eventType) {
	var args = [];
	for (var i = 1; i < arguments.length; i++) {
		args.push(arguments[i]);
	}
	if (!this._isConnected) {
		var me = this;
		this._connectQueue.push(function() {
			me._sendMessage('evt', eventType, args);
		});
		return this;
	}
	return this._sendMessage('evt', eventType, args);
};

Port.prototype.use = function use(fn) {
	this._pluginStartupValues.push(fn(this));
	return this;
};

module.exports = Port;
