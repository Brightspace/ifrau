'use strict';

function RequestTypeError(requestType) {
	this.name = 'RequestTypeError';
	this.message = requestType ? 'No onRequest handler for type "' + requestType + '"' : 'No handler defined for request';
}

RequestTypeError.prototype = Object.create(Error.prototype);
RequestTypeError.prototype.constructor = RequestTypeError;

module.exports = RequestTypeError;
