'use strict';

var inherits = require('inherits'),
	Promise = require('lie');

var PortWithRequests = require('./requests');

var typeNameValidator = /^[a-zA-Z]+[a-zA-Z\-]*$/;

function PortWithServices() {
	if (!(this instanceof PortWithServices)) {
		return new PortWithServices.apply(this, arguments);
	}

	PortWithRequests.apply(this, arguments);
}
inherits(PortWithServices, PortWithRequests);

PortWithServices.prototype.getService = function getService(sericeType, version) {
	if(!this._isConnected) {
		throw new Error('Cannot getService() before connect() has completed');
	}

	var serviceVersionPrefix = 'service:' + sericeType + ':' + version;
	var me = this;

	function createProxy(methodNames) {
		function createProxyMethod(name) {
			return function() {
				var args = new Array(arguments.length + 1);
				args[0] = serviceVersionPrefix + ':' + name;
				for(var i = 0; i < arguments.length; ++i) {
					args[i+1] = arguments[i];
				}

				return me.request.apply(me, args);
			};
		}

		var proxy = {};
		methodNames.forEach(function(name) {
			proxy[name] = createProxyMethod(name);
		});
		return proxy;
	}

	return me
		.request(serviceVersionPrefix)
		.then(createProxy);
};

PortWithServices.prototype.registerService = function registerService(serviceType, version, service) {
	if(this._isConnected) {
		throw new Error('Register services before connecting');
	}

	if(!typeNameValidator.test(serviceType)) {
		throw new Error('Invalid service type "' + serviceType + '"');
	}

	var serviceVersionPrefix = 'service:' + serviceType + ':' + version;

	var methodNames = Object
		.keys(service)
		.filter(function (k) {
			return typeof service[k] === 'function';
		});

	this.onRequest(serviceVersionPrefix, methodNames);

	var me = this;
	methodNames.forEach(function (name) {
		me.onRequest(serviceVersionPrefix + ':' + name, service[name]);
	});

	return this;
};

module.exports = PortWithServices;
