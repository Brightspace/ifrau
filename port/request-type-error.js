export class RequestTypeError extends Error {

	constructor(requestType) {
		super();
		this.name = 'RequestTypeError';
		this.message = requestType ? `No onRequest handler for type "${requestType}` : 'No handler defined for request';
	}

}
