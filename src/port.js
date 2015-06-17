export default class Port {
	constructor(endpoint, targetOrigin) {
		this.endpoint = endpoint;
		this.targetOrigin = targetOrigin;
		this.eventHandlers = {};
		this.requestHandlers = {};
		this.pendingRequests = {};
		this.waitingRequests = [];
		this.requestId = 0;
		this.debugEnabled = false;
	}
	close() {
		window.removeEventListener('message', this.receiveMessage);
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
		this.initHashArrAndPush(this.eventHandlers, eventType, handler);
		return this;
	}
	onRequest(requestType, handler) {
		if(this.requestHandlers[requestType] !== undefined) {
			throw new Error(`Duplicate onRequest handler for type "${requestType}"`);
		}
		this.requestHandlers[requestType] = handler;
		this.sendRequestResponse(requestType);
		return this;
	}
	open() {
		window.addEventListener('message', this.receiveMessage.bind(this), false);
		return this;
	}
	receiveMessage(e) {

		if(e.source !== this.endpoint || !e.data.key || e.data.key.indexOf('frau.') !== 0) {
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
			handler.call(handler, payload);
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
	sendEvent(eventType, data) {
		return this.sendMessage(`evt.${eventType}`, data);
	}
	sendRequestResponse(requestType) {

		var handler = this.requestHandlers[requestType];
		var waiting = this.waitingRequests[requestType];
		if(handler === undefined || waiting === undefined || waiting.length === 0) {
			return;
		}

		var me = this;
		Promise.resolve(handler())
			.then((val) => {
				waiting.forEach(function(id) {
					me.sendMessage(`res.${requestType}`, { id: id, val: val });
				});
				delete me.waitingRequests[requestType];
			});

	}
}
