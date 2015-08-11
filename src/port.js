import uuid from 'uuid';

import { fromError, toError } from './transform-error';

let typeNameValidator = /^[a-zA-Z]+[a-zA-Z\-]*$/;

export default class Port {
	constructor(endpoint, targetOrigin, options) {
		options = options || {};
		this.debugEnabled = options.debug || false;
		this.endpoint = endpoint;
		this.eventHandlers = {};
		this.eventQueue = [];
		this.isConnected = false;
		this.isOpen = false;
		this.onCloseCallbacks = [];
		this.pendingRequests = {};
		this.requestHandlers = {};
		this.services = {};
		this.targetOrigin = targetOrigin;
		this.waitingRequests = [];

		this.id = uuid();
		this.requestCounter = 0;
	}
	close() {
		if(!this.isOpen) {
			throw new Error('Port cannot be closed, call open() first');
		}
		this.isOpen = false;
		this.isConnected = false;
		window.removeEventListener('message', this.receiveMessage);
		this.onCloseCallbacks.forEach((cb) => cb());
		this.debug('closed');
	}
	connect() {
		this.isConnected = true;
		this.debug('connected');
		this.eventQueue.forEach((evt) => evt());
		this.eventQueue = [];
		return this;
	}
	debug(msg) {
		if(this.debugEnabled) {
			console.log(msg);
		}
	}
	getService(serviceType, version) {
		if(!this.isConnected) {
			throw new Error('Cannot getService() before connect() has completed');
		}
		let serviceVersionPrefix = `service:${serviceType}:${version}`;
		let me = this;
		function createProxyMethod(name) {
			return function() {
				let args = [`${serviceVersionPrefix}:${name}`];
				for(let i=0; i<arguments.length; i++) {
					args.push(arguments[i]);
				}
				return me.requestRaw.apply(me, args);
			};
		}
		function createProxy(methodNames) {
			let proxy = {};
			methodNames.forEach((name) => {
				proxy[name] = createProxyMethod(name);
			});
			return proxy;
		}
		return me.requestRaw(serviceVersionPrefix).then(createProxy);
	}
	initHashArrAndPush(dic, key, obj) {
		if(dic[key] === undefined ) {
			dic[key] = [];
		}
		dic[key].push(obj);
	}
	onClose(cb) {
		this.onCloseCallbacks.push(cb);
	}
	onEvent(eventType, handler) {
		this.debug(`onEvent handler added for "${eventType}"`);
		if(this.isConnected) {
			this.debug('You\'ve attached event handlers after connecting, you may have missed some events');
		}
		this.initHashArrAndPush(this.eventHandlers, eventType, handler);
		return this;
	}
	onRequest(requestType, handler) {
		if(this.isConnected) {
			throw new Error('Add request handlers before connecting');
		}
		if(this.requestHandlers[requestType] !== undefined) {
			throw new Error(`Duplicate onRequest handler for type "${requestType}"`);
		}
		this.debug(`onRequest handler added for "${requestType}"`);
		this.requestHandlers[requestType] = handler;
		this.sendRequestResponse(requestType);
		return this;
	}
	open() {
		if(this.isOpen) {
			throw new Error('Port is already open.');
		}
		this.isOpen = true;
		window.addEventListener('message', this.receiveMessage.bind(this), false);
		this.debug('opened');
		return this;
	}
	receiveMessage(e) {

		if(!Port.validateEvent(this.targetOrigin, this.endpoint, e)) {
			return;
		}

		var messageType = e.data.key.substr(5,3);
		var subType = e.data.key.substr(9);

		this.debug(`received ${messageType}.${subType}`);

		if(messageType === 'evt') {
			this.receiveEvent(subType, e.data.payload);
		} else if(messageType === 'req') {
			this.receiveRequest(subType, e.data.payload);
		} else if(messageType === 'res') {
			this.receiveRequestResponse(subType, e.data.payload);
		}

	}
	receiveEvent(eventType, payload) {
		if(this.eventHandlers[eventType] === undefined) {
			return;
		}
		this.eventHandlers[eventType].forEach(function(handler) {
			handler.apply(handler, payload);
		});
	}
	receiveRequest(requestType, payload) {
		this.initHashArrAndPush(this.waitingRequests, requestType, payload);
		this.sendRequestResponse(requestType);
	}
	receiveRequestResponse(requestType, payload) {

		var requests = this.pendingRequests[requestType];
		if(requests === undefined) {
			return;
		}

		for(var i=0; i<requests.length; i++) {
			var req = requests[i];
			if(req.id !== payload.id) {
				continue;
			}

			if (payload.hasOwnProperty('err')) {
				const error = toError(payload.err);
				req.reject(error);
			} else {
				req.resolve(payload.val);
			}

			requests.splice(i, 1);
			return;
		}

	}
	registerService(serviceType, version, service) {
		if(this.isConnected) {
			throw new Error('Register services before connecting');
		}
		if(!typeNameValidator.test(serviceType)) {
			throw new Error(`Invalid service type "${serviceType}"`);
		}
		let methodNames = [];
		for(let p in service) {
			if(typeof(service[p]) === 'function') {
				methodNames.push(p);
				this.onRequest(`service:${serviceType}:${version}:${p}`, service[p]);
			}
		}
		this.onRequest(`service:${serviceType}:${version}`, methodNames);
		return this;
	}
	request() {
		if(!this.isConnected) {
			throw new Error('Cannot request() before connect() has completed');
		}
		return this.requestRaw.apply(this, arguments);
	}
	requestRaw(requestType) {
		var args = [];
		for(var i=1; i<arguments.length; i++) {
			args.push(arguments[i]);
		}
		var me = this;
		return new Promise((resolve, reject) => {
			const id = `${me.id}_${++me.requestCounter}`;
			me.initHashArrAndPush(
					me.pendingRequests,
					requestType,
					{
						id: id,
						resolve,
						reject
					}
				);
			me.sendMessage(`req.${requestType}`,{id: id, args: args});
		});
	}
	sendMessage(key, data) {
		var message = {
			key: `frau.${key}`,
			payload: data
		};
		this.debug(`sending key: ${key}`);
		this.endpoint.postMessage(message, this.targetOrigin);
		return this;
	}
	sendEvent(eventType) {
		let args = [];
		for(let i=1; i<arguments.length; i++) {
			args.push(arguments[i]);
		}
		if(!this.isConnected) {
			const me = this;
			this.eventQueue.push(() => {
				me.sendMessage(`evt.${eventType}`, args);
			});
			return this;
		}
		return this.sendMessage(`evt.${eventType}`, args);
	}
	sendRequestResponse(requestType) {

		var handler = this.requestHandlers[requestType];
		var waiting = this.waitingRequests[requestType];
		delete this.waitingRequests[requestType];

		if(handler === undefined || waiting === undefined || waiting.length === 0) {
			return;
		}

		var me = this;

		waiting.forEach(function(w) {
			Promise
				.resolve()
				.then(() => {
					if (typeof(handler) === 'function') {
						return handler.apply(handler, w.args);
					}

					// otherwise "handler" is a value / Promise
					return handler;
				})
				.then((val) => {
					me.sendMessage(`res.${requestType}`, { id: w.id, val: val });
				})
				.catch((e) => {
					const err = fromError(e);

					me.sendMessage(`res.${requestType}`, { id: w.id, err });
				});
		});

	}
	use(fn) {
		fn(this);
		return this;
	}
	static validateEvent(targetOrigin, endpoint, e) {
		var isValid = (e.source === endpoint) &&
			(targetOrigin === '*' || targetOrigin === e.origin) &&
			(e.data.key !== undefined) &&
			(e.data.key !== null) &&
			(e.data.key.indexOf('frau.') === 0);
		return isValid;
	}
}
