import { fromError, toError } from './transform-error.js';
import { Port } from './port.js';
import { RequestTypeError } from './request-type-error.js';

export class PortWithRequests extends Port {

	constructor(endPoint, targetOrigin, options) {
		super(endPoint, targetOrigin, options);

		this._pendingRequests = {};
		this._requestHandlers = {};
		this._requestCounter = 0;
		this._waitingRequests = [];

		this._onMessage('req', (eventType, payload) => {
			this._receiveRequest(eventType, payload);
		});

		this._onMessage('res', (eventType, payload) => {
			this._receiveRequestResponse(eventType, payload);
		});
	}

	onRequest(requestType, handler) {
		if (this._isConnected) throw new Error('Add request handlers before connecting');

		if (this._requestHandlers[requestType] !== undefined) {
			throw new Error(`Duplicate onRequest handler for type "${requestType}"`);
		}

		this.debug(`onRequest handler added for ${requestType}`);

		this._requestHandlers[requestType] = handler;

		// process requests we've received before adding handler, somehow
		this._sendRequestResponse(requestType);
		return this;
	}

	request(requestType) {
		const args = new Array(arguments.length - 1);
		for (let i = 1; i < arguments.length; ++i) {
			args[i - 1] = arguments[i];
		}

		return new Promise((resolve, reject) => {
			const counter = ++this._requestCounter;
			const id = `${this._id}_${counter}`;

			this._initHashArrAndPush(this._pendingRequests, requestType, {
				id: id,
				resolve: resolve,
				reject: reject
			});

			const finish = () => {
				this._sendMessage('req', requestType, {
					id: id,
					args: args
				});
			};

			if (this._isConnected) finish();
			else this._connectQueue.push(finish);
		});
	}

	_receiveRequest(requestType, payload) {
		this._initHashArrAndPush(this._waitingRequests, requestType, payload);
		this._sendRequestResponse(requestType);
	}

	_receiveRequestResponse(requestType, payload) {
		const requests = this._pendingRequests[requestType];
		if (requests === undefined) {
			return;
		}

		// search for the request this response is for
		for (let i = 0; i < requests.length; ++i) {
			const req = requests[i];
			if (req.id !== payload.id) {
				continue;
			}

			// eslint-disable-next-line no-prototype-builtins
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

	_sendRequestResponse(requestType) {
		const handler = this._requestHandlers[requestType];
		const waiting = this._waitingRequests[requestType];
		delete this._waitingRequests[requestType];

		if (waiting === undefined || waiting.length === 0) {
			return;
		}

		if (handler === undefined) {
			const noHandler = fromError(new RequestTypeError(requestType));
			waiting.forEach(w => {
				this._sendMessage('res', requestType, { id: w.id, err: noHandler });
			});
			return;
		}

		waiting.forEach(w => {
			Promise.resolve().then(() => {
				if (typeof handler === 'function') {
					return handler.apply(handler, w.args);
				}

				// otherwise "handler" is a value / Promise
				return handler;
			}).then(val => {
				this._sendMessage('res', requestType, { id: w.id, val: val });
			}).catch(e => {
				const err = fromError(e);
				this._sendMessage('res', requestType, { id: w.id, err: err });
			});
		});
	}

}
