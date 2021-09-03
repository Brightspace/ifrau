import { getUniqueId } from './unique-id.js';
import { validateEvent } from './validate-event.js';

export class Port {

	constructor(endPoint, targetOrigin, options) {
		options = options || {};

		this._connectQueue = [];
		this._pluginStartupValues = [];
		this._debugEnabled = options.debug || false;
		this._endPoint = endPoint;
		this._eventHandlers = {};
		this._isConnected = false;
		this._isOpen = false;
		this._messageHandlers = {};
		this._onCloseCallbacks = [];
		this._targetOrigin = targetOrigin;

		this._id = getUniqueId();

		this._onMessage('evt', (eventType, payload) => {
			this._receiveEvent(eventType, payload);
		});
	}

	close() {
		if (!this._isOpen) throw new Error('Port cannot be closed, call open() first');

		this._isOpen = false;
		this._isConnected = false;
		window.removeEventListener('message', this._receiveMessage.bind(this), false);
		this._onCloseCallbacks.forEach(cb => cb());
		this.debug('closed');
	}

	async connect() {
		this._isConnected = true;
		this.debug('connected');
		this._connectQueue.forEach(func => func());
		this._connectQueue = [];

		await Promise.all(this._pluginStartupValues);
		this._pluginStartupValues = null;
		return this;
	}

	debug(msg) {
		if (this._debugEnabled) {
			/* eslint-disable no-console */
			console.log(msg);
		}
	}

	set endPoint(endPoint) {
		this._endPoint = endPoint;
	}

	onClose(cb) {
		this._onCloseCallbacks.push(cb);
	}

	onEvent(eventType, handler) {
		this.debug(`onEvent handler added for "${eventType}"`);
		if (this._isConnected) {
			this.debug('You\'ve attached event handlers after connecting, you may have missed some events');
		}
		this._initHashArrAndPush(this._eventHandlers, eventType, handler);
		return this;
	}

	open() {
		if (this._isOpen) {
			throw new Error('Port is already open.');
		}
		this._isOpen = true;
		window.addEventListener('message', this._receiveMessage.bind(this), false);
		this.debug('opened');
		return this;
	}

	set origin(origin) {
		this._targetOrigin = origin;
	}

	sendEvent(eventType) {
		const args = [];
		for (let i = 1; i < arguments.length; i++) {
			args.push(arguments[i]);
		}
		if (!this._isConnected) {
			this._connectQueue.push(() => {
				this._sendMessage('evt', eventType, args);
			});
			return this;
		}
		return this._sendMessage('evt', eventType, args);
	}

	use(fn) {
		this._pluginStartupValues.push(fn(this));
		return this;
	}

	_initHashArrAndPush(dic, key, obj) {
		if (dic[key] === undefined) dic[key] = [];
		dic[key].push(obj);
	}

	_onMessage(clazz, handler) {
		if (clazz.length !== 3) {
			throw new Error('message class name must be 3 characters');
		}

		this._messageHandlers[clazz] = handler;
	}

	_receiveEvent(eventType, payload) {
		if (this._eventHandlers[eventType] === undefined) {
			return;
		}
		this._eventHandlers[eventType].forEach(handler => {
			handler.apply(handler, payload);
		});
	}

	_receiveMessage(e) {
		if (!validateEvent(this._targetOrigin, this._endPoint, e)) {
			return;
		}

		const clazz = e.data.key.substr(5, 3);
		const key = e.data.key.substr(9);

		this.debug(`received ${clazz}.${key}`);

		const handler = this._messageHandlers[clazz];
		if (handler) handler.call(this, key, e.data.payload);
	}

	_sendMessage(clazz, key, data) {
		const message = {
			key: `frau.${clazz}.${key}`,
			payload: data
		};
		this.debug(`sending key: ${message.key}`);
		this._endPoint.postMessage(message, this._targetOrigin);
		return this;
	}

}
