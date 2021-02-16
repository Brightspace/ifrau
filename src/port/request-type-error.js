var inherits = require('inherits');

function RequestTypeError(requestType) {
	this.name = 'RequestTypeError';
	this.message = requestType ? 'No onRequest handler for type "' + requestType + '"' : 'No handler defined for request';
}
inherits(RequestTypeError, Error);

module.exports = RequestTypeError;
