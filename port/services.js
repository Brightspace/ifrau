import { PortWithRequests } from './requests.js';

const typeNameValidator = /^[a-zA-Z]+[a-zA-Z-]*$/;

export class PortWithServices extends PortWithRequests {

	constructor(endPoint, targetOrigin, options) {
		super(endPoint, targetOrigin, options);
	}

	async getService(serviceType, version) {
		if (!this._isConnected) {
			throw new Error('Cannot getService() before connect() has completed');
		}

		const serviceVersionPrefix = `service:${serviceType}:${version}`;
		const me = this;

		function createProxy(methodNames) {
			function createProxyMethod(name) {
				return function() {
					const args = new Array(arguments.length + 1);
					args[0] = `${serviceVersionPrefix}:${name}`;
					for (let i = 0; i < arguments.length; ++i) {
						args[i + 1] = arguments[i];
					}

					return me.request.apply(me, args);
				};
			}

			const proxy = {};
			methodNames.forEach(function(name) {
				proxy[name] = createProxyMethod(name);
			});
			return proxy;
		}

		const methodNames_1 = await this.request(serviceVersionPrefix);
		return createProxy(methodNames_1);
	}

	registerService(serviceType, version, service) {
		if (this._isConnected) {
			throw new Error('Register services before connecting');
		}

		if (!typeNameValidator.test(serviceType)) {
			throw new Error(`Invalid service type ${serviceType}`);
		}

		const serviceVersionPrefix = `service:${serviceType}:${version}`;

		const methodNames = Object
			.keys(service)
			.filter(k => {
				return typeof service[k] === 'function';
			});

		this.onRequest(serviceVersionPrefix, methodNames);

		methodNames.forEach(name => {
			this.onRequest(`${serviceVersionPrefix}:${name}`, service[name]);
		});

		return this;
	}

}
