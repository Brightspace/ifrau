export default class Port {
	constructor(endpoint, targetOrigin, options) {
		options = options || {};
		this.endpoint = endpoint;
		this.targetOrigin = targetOrigin;
		this.eventHandlers = {};
		this.requestHandlers = {};
		this.pendingRequests = {};
		this.waitingRequests = [];
		this.requestId = 0;
		this.debugEnabled = options.debug || false;
		this.isConnected = false;
		this.isOpen = false;
	}
	close() {
		if(!this.isOpen) {
			throw new Error('Port cannot be closed, call open() first');
		}
		this.isOpen = false;
		this.isConnected = false;
		window.removeEventListener('message', this.receiveMessage);
		this.debug('closed');
	}
	connect() {
		this.isConnected = true;
		this.debug('connected');
		return this;
	}
	debug(msg) {
		if(this.debugEnabled) {
			console.log(msg);
		}
	}
	initHashArrAndPush(dic, key, obj) {
		if(dic[key] === undefined ) {
			dic[key] = [];
		}
		dic[key].push(obj);
	}
	onEvent(eventType, handler) {
		if(this.isConnected) {
			throw new Error('Add event handlers before connecting');
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
		this.initHashArrAndPush(this.waitingRequests, requestType, payload.id);
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
			req.promise(payload.val);
			requests.splice(i, 1);
			return;
		}

	}
	request(requestType) {
		if(!this.isConnected) {
			throw new Error('Cannot request() before connect() has completed');
		}
		return this.requestRaw(requestType);
	}
	requestRaw(requestType) {
		var me = this;
		return new Promise((resolve, reject) => {
			var id = ++me.requestId;
			me.initHashArrAndPush(
					me.pendingRequests,
					requestType,
					{
						id: id,
						promise: resolve,
					}
				);
			me.sendMessage(`req.${requestType}`,{id: id});
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
		if(!this.isConnected) {
			throw new Error('Cannot sendEvent() before connect() has completed');
		}
		var args = [];
		for(var i=1; i<arguments.length; i++) {
			args.push(arguments[i]);
		}
		return this.sendEventRaw(eventType, args);
	}
	sendEventRaw(eventType, data) {
		return this.sendMessage(`evt.${eventType}`, data);
	}
	sendRequestResponse(requestType) {

		var handler = this.requestHandlers[requestType];
		var waiting = this.waitingRequests[requestType];
		if(handler === undefined || waiting === undefined || waiting.length === 0) {
			return;
		}

		if(typeof(handler) === 'function') {
			handler = handler();
		}

		var me = this;
		Promise.resolve(handler)
			.then((val) => {
				waiting.forEach(function(id) {
					me.sendMessage(`res.${requestType}`, { id: id, val: val });
				});
				delete me.waitingRequests[requestType];
			});

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
