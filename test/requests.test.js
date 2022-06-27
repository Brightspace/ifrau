import chai, { expect } from 'chai';
import { fromError } from '../port/transform-error.js';
import { Port } from '../port/port.js';
import { PortWithRequests } from '../port/requests.js';
import { RequestTypeError } from '../port/request-type-error.js';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

chai.use(sinonChai).should();

const targetOrigin = 'http://cdn.com/app/index.html';

describe('requests', () => {

	let port, endpoint;

	beforeEach(async() => {
		global.window = {
			addEventListener: sinon.stub(),
			removeEventListener: sinon.stub()
		};
		endpoint = {
			postMessage: sinon.stub()
		};
		port = new PortWithRequests(endpoint, targetOrigin);
	});

	describe('onRequest', () => {

		let _sendRequestResponse;

		beforeEach(() => {
			_sendRequestResponse = sinon.stub(port, '_sendRequestResponse');
		});

		afterEach(() => {
			_sendRequestResponse.restore();
		});

		it('should add to _requestHandlers', () => {
			const handler = () => {};
			port.onRequest('foo', handler);
			expect(port._requestHandlers).to.eql({ foo: handler });
		});

		it('should attempt to send response immediately', () => {
			port.onRequest('foo', () => {});
			_sendRequestResponse.should.have.been.calledWith('foo');
		});

		it('should throw if duplicate handler is defined', () => {
			expect(() => {
				port.onRequest('foo', () => {});
				port.onRequest('foo', () => {});
			}).to.throw(Error, /Duplicate onRequest handler for type "foo"/);
		});

		it('should return "this"', () => {
			const p = port.onRequest('foo', () => {});
			expect(p).to.equal(port);
		});

		it('should throw if already connected', () => {
			port.connect();
			expect(() => {
				port.onRequest('foo', 'bar');
			}).to.throw(Error, 'Add request handlers before connecting');
		});

	});

	describe('receiveMessageHandlers', () => {

		let _receiveEvent, _receiveRequest, _receiveRequestResponse;

		beforeEach(() => {
			_receiveEvent = sinon.stub(Port.prototype, '_receiveEvent');
			_receiveRequest = sinon.stub(port, '_receiveRequest');
			_receiveRequestResponse = sinon.stub(port, '_receiveRequestResponse');
		});

		afterEach(() => {
			_receiveEvent.restore();
			_receiveRequest.restore();
			_receiveRequestResponse.restore();
		});

		it('should not handle invalid events', () => {
			port._receiveMessage({ source: 'evil' });
			_receiveRequest.should.not.have.been.called;
			_receiveRequestResponse.should.not.have.been.called;
		});

		it('should not handle unrecognized message types', () => {
			port._receiveMessage({
				source: endpoint,
				origin: targetOrigin,
				data: { key: 'frau.foo.bar' }
			});
			_receiveRequest.should.not.have.been.called;
			_receiveRequestResponse.should.not.have.been.called;
		});

		it('should pass "evt" messages to "_receiveEvent"', () => {
			port._receiveMessage({
				source: endpoint,
				origin: targetOrigin,
				data: { key: 'frau.evt.myEvent', payload: ['bar', false] }
			});
			_receiveRequest.should.not.have.been.called;
			_receiveRequestResponse.should.not.have.been.called;
		});

		it('should pass "req" messages to "_receiveRequest"', () => {
			port._receiveMessage({
				source: endpoint,
				origin: targetOrigin,
				data: { key: 'frau.req.myRequest', payload: 'foo' }
			});
			_receiveRequest.should.have.been.calledWith('myRequest', 'foo');
		});

		it('should pass "res" messages to "_receiveRequestResponse"', () => {
			port._receiveMessage({
				source: endpoint,
				origin: targetOrigin,
				data: { key: 'frau.res.myResponse', payload: 23 }
			});
			_receiveRequestResponse
				.should.have.been.calledWith('myResponse', 23);
		});

	});

	describe('_receiveRequest', () => {

		let _sendRequestResponse, _initHashArrAndPush;

		beforeEach(() => {
			_sendRequestResponse = sinon.stub(port, '_sendRequestResponse');
			_initHashArrAndPush = sinon.stub(port, '_initHashArrAndPush');
		});

		afterEach(() => {
			_sendRequestResponse.restore();
			_initHashArrAndPush.restore();
		});

		it('should queue request in "_waitingRequests"', () => {
			port._receiveRequest('foo', { id: 'rId', args: ['bar', false, -1] });
			_initHashArrAndPush.should.have.been.calledWith(
				port._waitingRequests,
				'foo',
				{ id: 'rId', args: ['bar', false, -1] }
			);
		});

		it('should attempt to send response', () => {
			port._receiveRequest('foo', { id: 'rId', args: [] });
			_sendRequestResponse.should.have.been.calledWith('foo');
		});

	});

	describe('_receiveRequestResponse', () => {

		it('should ignore responses which aren\'t pending', (done) => {
			const req = {
				resolve: sinon.spy(),
				reject: sinon.spy()
			};
			port._pendingRequests.foo = [req];
			port._receiveRequestResponse('bar', { id: port.requestId });
			setTimeout(() => {
				req.resolve.should.not.have.been.called;
				req.reject.should.not.have.been.called;
				done();
			});
		});

		it('should only respond to request with matching id', (done) => {
			const req1 = {
				id: 1,
				resolve: sinon.spy(),
				reject: sinon.spy()
			};
			const req2 = {
				id: 2,
				resolve: sinon.spy(),
				reject: sinon.spy()
			};
			port._pendingRequests.foo = [req1, req2];
			port._receiveRequestResponse('foo', { id: 2 });
			setTimeout(() => {
				req1.resolve.should.not.have.been.called;
				req1.reject.should.not.have.been.called;
				req2.resolve.should.have.been.calledOnce;
				req2.reject.should.not.have.been.called;
				done();
			});
		});

		it('should reject request with an Error when the response has "err" property', (done) => {
			const
				errored = {
					id: 1,
					resolve: sinon.spy(),
					reject: sinon.spy()
				},
				succeeded = {
					id: 2,
					resolve: sinon.spy(),
					reject: sinon.spy()
				};

			port._pendingRequests.foo = [errored, succeeded];

			const err = fromError(new Error('bad things'));

			port._receiveRequestResponse('foo', { id: errored.id, err });
			port._receiveRequestResponse('foo', { id: succeeded.id });

			setTimeout(() => {
				errored.resolve.should.not.have.been.called;
				errored.reject.should.have.been.calledWithMatch(sinon.match.instanceOf(Error));

				succeeded.resolve.should.have.been.called;
				succeeded.reject.should.not.have.been.called;

				done();
			});
		});

	});

	describe('request', () => {

		let _sendMessage, _initHashArrAndPush;

		beforeEach(() => {
			_sendMessage = sinon.stub(port, '_sendMessage');
			_initHashArrAndPush = sinon.stub(port, '_initHashArrAndPush');
		});

		afterEach(() => {
			_sendMessage.restore();
			_initHashArrAndPush.restore();
		});

		it('should queue if not connected', () => {
			port.request('foo');
			_sendMessage.should.not.have.been.called;
			expect(port._connectQueue.length).to.equal(1);
		});

		it('should send queued messages after connect', () => {
			port.request('foo');
			port.connect();
			_sendMessage.should.have.been.calledWith('req', 'foo');
		});

		it('should return a promise', () => {
			const promise = port.connect();
			port.request('foo');
			expect(promise).to.not.be.undefined;
			expect(promise.then).to.not.be.undefined;
		});

		it('should add to "_pendingRequests"', () => {
			port.connect();
			port.request('foo');
			_initHashArrAndPush.should.have.been.calledWith(
				port._pendingRequests,
				'foo',
				{
					id: sinon.match.string,
					resolve: sinon.match.func,
					reject: sinon.match.func
				}
			);
		});

		it('should send message', () => {
			port.connect();
			port.request('foo');
			_sendMessage.should.have.been.calledWith(
				'req',
				'foo',
				{ id: `${port._id}_1`, args: [] }
			);
		});

		it('should pass arguments', () => {
			port.connect();
			port.request('foo', 'bar', true, -3);
			_sendMessage.should.have.been.calledWith(
				'req',
				'foo',
				{ id: `${port._id}_1`, args: ['bar', true, -3] }
			);
		});

		it('should send each message with a new ID', () => {
			port.connect();
			port.request('foo');
			port.request('bar');
			_sendMessage.should.have.been.calledWith('req', 'foo', { id: `${port._id}_1`, args: [] });
			_sendMessage.should.have.been.calledWith('req', 'bar', { id: `${port._id}_2`, args: [] });
		});

	});

	describe('_sendRequestResponse', () => {

		let _sendMessage;

		beforeEach(() => {
			_sendMessage = sinon.stub(port, '_sendMessage');
		});

		afterEach(() => {
			_sendMessage.restore();
		});

		[
			{ name: 'value', val: 'foo', expect: 'foo' },
			{ name: 'function', val: () => 'hello', expect: 'hello' },
			{ name: 'promise', val: new Promise((resolve) => {
				resolve(true);
			}), expect: true },
			{ name: 'function-promise', val: () => new Promise((resolve) => {
				resolve(49);
			}), expect: 49 }
		].forEach((test) => {
			it(`should handle ${test.name}-based responses`, (done) => {
				port._requestHandlers.bar = test.val;
				port._waitingRequests.bar = [{ id: 1, args:[] }];
				port._sendRequestResponse('bar');
				setTimeout(() => {
					_sendMessage.should.have.been.calledWith(
						'res',
						'bar',
						{ id: 1, val: test.expect }
					);
					done();
				});
			});
		});

		it('should pass arguments to handler', (done) => {
			const handler = sinon.spy();
			port._requestHandlers.bar = handler;
			port._waitingRequests.bar = [{ id: 1, args:['p1', 'p2', true] }];
			port._sendRequestResponse('bar');
			setTimeout(() => {
				handler.should.have.been.calledWith('p1', 'p2', true);
				done();
			});
		});

		it('should pass different arguments to handler', (done) => {
			const handler = sinon.spy();
			port._requestHandlers.bar = handler;
			port._waitingRequests.bar = [
				{ id: 1, args:['p1', 'p2', true] },
				{ id: 2, args:['p3', 'p4', false] }
			];
			port._sendRequestResponse('bar');
			setTimeout(() => {
				handler.should.have.been.calledWith('p1', 'p2', true);
				handler.should.have.been.calledWith('p3', 'p4', false);
				done();
			});
		});

		it('should send handler value to each waiting request', (done) => {
			port._requestHandlers.bar = 'hello';
			port._waitingRequests.bar = [{ id: 1, args:[] }, { id: 2, args:[] }];
			port._sendRequestResponse('bar');
			setTimeout(() => {
				_sendMessage.should.have.been.calledWith(
					'res',
					'bar',
					{ id: 1, val: 'hello' }
				);
				_sendMessage.should.have.been.calledWith(
					'res',
					'bar',
					{ id: 2, val: 'hello' }
				);
				done();
			});
		});

		it('should propogate error to the client if there is no handler', (done) => {
			const e = new RequestTypeError('bar');

			port._waitingRequests.bar = [{ id: 1, args: [] }];
			port._sendRequestResponse('bar');

			setTimeout(() => {
				_sendMessage.should.have.been.calledWith('res', 'bar', {
					id: 1,
					err: fromError(e)
				});
				done();
			});
		});

		it('should not call handler or send a message if no waiting requests', (done) => {
			const handler = sinon.spy();
			port._requestHandlers.bar = handler;
			port._sendRequestResponse('bar');
			setTimeout(() => {
				handler.should.not.have.been.called;
				_sendMessage.should.not.have.been.called;
				done();
			});
		});

		it('should propogate error to the client if handler throws', (done) => {
			const e = new TypeError('bad things');
			function handler() {
				throw e;
			}

			const reqType = 'bar';
			port._requestHandlers[reqType] = handler;
			port._waitingRequests[reqType] = [{ id: 1, args: [] }];

			port._sendRequestResponse(reqType);

			setTimeout(() => {
				_sendMessage.should.have.been.calledWith('res', 'bar', {
					id: 1,
					err: fromError(e)
				});
				done();
			});
		});

		it('should propogate error to the client if handler returns rejected Promise', (done) => {
			const e = new TypeError('bad things');
			function handler() {
				return Promise.reject(e);
			}

			const reqType = 'bar';
			port._requestHandlers[reqType] = handler;
			port._waitingRequests[reqType] = [{ id: 1, args: [] }];

			port._sendRequestResponse(reqType);

			setTimeout(() => {
				_sendMessage.should.have.been.calledWith('res', 'bar', {
					id: 1,
					err: fromError(e)
				});
				done();
			});
		});
	});
});
