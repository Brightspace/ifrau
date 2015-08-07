var chai = require('chai'),
	expect = chai.expect,
	sinon = require('sinon');

chai.should();
chai.use(require('sinon-chai'));

import { fromError, toError } from '../src/transform-error';
import Port from '../src/port';

var targetOrigin = 'http://cdn.com/app/index.html';

describe('port', () => {

	var port, endpoint, consoleSpy;

	beforeEach(() => {
		global.window = {
			addEventListener: sinon.stub(),
			removeEventListener: sinon.stub()
		};
		endpoint = {
			postMessage: sinon.stub()
		};
		port = new Port(endpoint, targetOrigin);
	});

	describe('close', () => {

		it('should throw if port is not already open', () => {
			expect(() => {
				port.close();
			}).to.throw(Error, 'Port cannot be closed, call open() first');
		});

		it('should stop listening for "message" events', () => {
			port.open();
			port.close();
			global.window.removeEventListener
				.should.have.been.calledWith('message', port.receiveMessage );
		});

		it('should disconnect port', () => {
			port.open();
			port.close();
			expect(port.isConnected).to.be.false;
		});

	});

	describe('connect', () => {

		it('should return a  promise', () => {
			var p = port.connect();
			expect(p).to.be.defined;
			expect(p.then).to.be.defined;
		});

	});

	describe('debug', () => {

		var consoleSpy;

		beforeEach(() => {
			consoleSpy = sinon.spy(global.console, 'log');
		});

		afterEach(() => {
			consoleSpy.restore();
		});


		it('should not write to console by default', () => {
			var p = new Port(endpoint, targetOrigin);
			p.debug('hello');
			consoleSpy.should.not.have.been.called;
		});

		it('should not write to console when disabled', () => {
			var p = new Port(endpoint, targetOrigin,{ debug: false});
			p.debug('hello');
			consoleSpy.should.not.have.been.called;
		});

		it('should write to console when enabled', () => {
			var p = new Port(endpoint, targetOrigin,{ debug: true});
			p.debug('hello');
			consoleSpy.should.have.been.calledWith('hello');
		});

	});

	describe('getService', () => {

		var requestRaw;

		beforeEach(() => {
			requestRaw = sinon.stub(port, 'requestRaw');
			requestRaw.withArgs('service:foo:1.0').returns(
				new Promise((resolve, reject) => {
					setTimeout(() => {
						resolve(['a', 'b']);
					});
				})
			);
			requestRaw.withArgs('service:foo:1.0:a', '1', true).returns(5);
		});

		afterEach(() => {
			requestRaw.restore();
		});

		it('should throw if not connected', () => {
			expect(() => {
				port.getService('foo', '1.0');
			}).to.throw(Error, 'Cannot getService() before connect() has completed');
		});

		it('should return a promise', () => {
			var promise = port.connect().getService('foo', '1.0');
			expect(promise).to.be.defined;
			expect(promise.then).to.be.defined;
		});

		it('should create a proxy with each method exposed', (done) => {
			port.connect().getService('foo', '1.0')
				.then((foo) => {
					requestRaw.should.have.been.calledWith('service:foo:1.0');
					expect(foo).to.be.defined;
					expect(foo.a).to.be.defined;
					expect(foo.b).to.be.defined;
					done();
				});
		});

		it('should send requests for method calls, passing arguments', (done) => {
			port.connect().getService('foo', '1.0')
				.then((foo) => {
					var result = foo.a('1', true);
					requestRaw.should.have.been.calledWith('service:foo:1.0:a', '1', true);
					expect(result).to.eql(5);
					done();
				});
		});

	});

	describe('initHashArrAndPush', () => {

		it('should create array entry if it does not exist', () => {
			var hash = {};
			port.initHashArrAndPush(hash, 'foo', 'bar');
			expect(hash.foo).to.eql(['bar']);
		});

		it('should append to existing entry', () => {
			var hash = { foo: ['bar'] };
			port.initHashArrAndPush(hash, 'foo', 'hello');
			expect(hash.foo).to.eql([ 'bar', 'hello']);
		});

	});

	describe('onEvent', () => {

		var initHashArrAndPush;

		beforeEach(() => {
			initHashArrAndPush = sinon.stub(port, 'initHashArrAndPush');
		});

		afterEach(() => {
			initHashArrAndPush.restore();
		});

		it('should add to eventHandlers', () => {
			var handler = () => {};
			port.onEvent('foo', handler);
			initHashArrAndPush.should.have.been.calledWith(
				port.eventHandlers, 'foo', handler
			);
		});

		it('should return "this"', () => {
			var p = port.onEvent('foo', () => {});
			expect(p).to.equal(port);
		});

	});

	describe('onRequest', () => {

		var sendRequestResponse;

		beforeEach(() => {
			sendRequestResponse = sinon.stub(port, 'sendRequestResponse');
		});

		afterEach(() => {
			sendRequestResponse.restore();
		});

		it('should add to requestHandlers', () => {
			var handler = () => {};
			port.onRequest('foo', handler);
			expect(port.requestHandlers).to.eql({ foo: handler });
		});

		it('should attempt to send response immediately', () => {
			port.onRequest('foo', () => {});
			sendRequestResponse.should.have.been.calledWith('foo');
		});

		it('should throw if duplicate handler is defined', () => {
			expect(() => {
				port.onRequest('foo', () => {});
				port.onRequest('foo', () => {});
			}).to.throw(Error, /Duplicate onRequest handler for type "foo"/);
		});

		it('should return "this"', () => {
			var p = port.onRequest('foo', () => {});
			expect(p).to.equal(port);
		});

		it('should throw if already connected', () => {
			port.connect();
			expect(() => {
				port.onRequest('foo', 'bar');
			}).to.throw(Error, 'Add request handlers before connecting');
		});

	});

	describe('open', () => {

		it('should listen for "message" events', ()=> {
			port.open();
			global.window.addEventListener
				.should.have.been.calledWith('message');
		});

		it('should return "this"', () => {
			var val = port.open();
			expect(val).to.equal(port);
		});

		it('should throw if already open', () => {
			port.open();
			expect(() => {
				port.open();
			}).to.throw(Error, 'Port is already open.');
		});

	});

	describe('receiveEvent', () => {

		it('should not call handlers for different events', () => {
			var handler = sinon.spy();
			port.onEvent('foo', handler);
			port.receiveEvent('bar');
			handler.should.not.have.been.called;
		});

		it('should pass payload as arguments to handler', () => {
			var handler = sinon.spy();
			port.onEvent('foo', handler);
			port.receiveEvent('foo', ['bar', true, -2]);
			handler.should.have.been.calledWith('bar', true, -2);
		});

		it('should call each handler for the event with payload', () => {
			var handler1 = sinon.spy();
			var handler2 = sinon.spy();
			port.onEvent('foo', handler1)
				.onEvent('foo', handler2);
			port.receiveEvent('foo', ['bar']);
			handler1.should.have.been.calledWith('bar');
			handler2.should.have.been.calledWith('bar');
		});

	});

	describe('receiveMessage', () => {

		var receiveEvent, receiveRequest, receiveRequestResponse;

		beforeEach(() => {
			receiveEvent = sinon.stub(port, 'receiveEvent');
			receiveRequest = sinon.stub(port, 'receiveRequest');
			receiveRequestResponse = sinon.stub(port, 'receiveRequestResponse');
		});

		afterEach(() => {
			receiveEvent.restore();
			receiveRequest.restore();
			receiveRequestResponse.restore();
		});

		it('should not handle invalid events', () => {
			port.receiveMessage({ source: 'evil' });
			receiveEvent.should.not.have.been.called;
			receiveRequest.should.not.have.been.called;
			receiveRequestResponse.should.not.have.been.called;
		});

		it('should not handle unrecognized message types', () => {
			port.receiveMessage({
				source: endpoint,
				origin: targetOrigin,
				data: { key: 'frau.foo.bar' }
			});
			receiveEvent.should.not.have.been.called;
			receiveRequest.should.not.have.been.called;
			receiveRequestResponse.should.not.have.been.called;
		});

		it('should pass "evt" messages to "receiveEvent"', () => {
			port.receiveMessage({
				source: endpoint,
				origin: targetOrigin,
				data: { key: 'frau.evt.myEvent', payload: ['bar', false] }
			});
			receiveEvent.should.have.been.calledWith('myEvent', ['bar', false]);
		});

		it('should pass "req" messages to "receiveRequest"', () => {
			port.receiveMessage({
				source: endpoint,
				origin: targetOrigin,
				data: { key: 'frau.req.myRequest', payload: 'foo' }
			});
			receiveRequest.should.have.been.calledWith('myRequest', 'foo');
		});

		it('should pass "res" messages to "receiveRequestResponse"', () => {
			port.receiveMessage({
				source: endpoint,
				origin: targetOrigin,
				data: { key: 'frau.res.myResponse', payload: 23 }
			});
			receiveRequestResponse
				.should.have.been.calledWith('myResponse', 23);
		});

	});

	describe('receiveRequest', () => {

		var sendRequestResponse, initHashArrAndPush;

		beforeEach(() => {
			sendRequestResponse = sinon.stub(port, 'sendRequestResponse');
			initHashArrAndPush = sinon.stub(port, 'initHashArrAndPush');
		});

		afterEach(() => {
			sendRequestResponse.restore();
			initHashArrAndPush.restore();
		});

		it('should queue request in "waitingRequests"', () => {
			port.receiveRequest('foo', { id: 'rId', args: ['bar', false, -1] });
			initHashArrAndPush.should.have.been.calledWith(
				port.waitingRequests,
				'foo',
				{ id: 'rId', args: ['bar', false, -1] }
			);
		});

		it('should attempt to send response', () => {
			port.receiveRequest('foo', { id: 'rId', args: [] });
			sendRequestResponse.should.have.been.calledWith('foo');
		});

	});

	describe('receiveRequestResponse', () => {

		it('should ignore responses which aren\'t pending', (done) => {
			var req = {
				resolve: sinon.spy(),
				reject: sinon.spy()
			};
			port.pendingRequests.foo = [req];
			port.receiveRequestResponse('bar', {id: port.requestId});
			setTimeout(() => {
				req.resolve.should.not.have.been.called;
				req.reject.should.not.have.been.called;
				done();
			});
		});

		it('should only respond to request with matching id', (done) => {
			var req1 = {
				id: 1,
				resolve: sinon.spy(),
				reject: sinon.spy()
			};
			var req2 = {
				id: 2,
				resolve: sinon.spy(),
				reject: sinon.spy()
			};
			port.pendingRequests.foo = [req1, req2];
			port.receiveRequestResponse('foo', {id: 2});
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

			port.pendingRequests.foo = [errored, succeeded];

			const err = fromError(new Error('bad things'));

			port.receiveRequestResponse('foo', { id: errored.id, err });
			port.receiveRequestResponse('foo', { id: succeeded.id });

			setTimeout(() => {
				errored.resolve.should.not.have.been.called;
				errored.reject.should.have.been.calledWithMatch(sinon.match.instanceOf(Error));

				succeeded.resolve.should.have.been.called;
				succeeded.reject.should.not.have.been.called;

				done();
			});
		});

	});

	describe('registerService', () => {

		var onRequest;

		beforeEach(() => {
			onRequest = sinon.stub(port, 'onRequest');
		});

		afterEach(() => {
			onRequest.restore();
		});

		it('should throw if register happens after connect', () => {
			expect(() => {
				port.connect().registerService('foo', '1.0', {});
			}).to.throw(Error, 'Register services before connecting');
		});

		['123', 'a1', 'a.b', 'a:b', '-ab'].forEach((name) => {
			it(`should throw for invalid service name: ${name}`, () => {
				expect(() => {
					port.registerService(name, '1.0', {});
				}).to.throw(Error, 'Invalid service type');
			});
		});

		['a', 'A', 'ab', 'aB', 'a-b'].forEach((name) => {
			it(`should allow valid service name: ${name}`, () => {
				port.registerService(name, '1.0', {});
				onRequest.should.have.been.calledWith(`service:${name}:1.0`);
			});
		});

		it('should add a single onRequest handler for the service definition', () => {
			port.registerService('fooService', '1.0', {
				a: function() {},
				b: function() {},
				c: 5
			});
			onRequest.should.have.been.calledWith(
				'service:fooService:1.0',
				['a', 'b']
			);
		});

		it('should add an onRequest handler for each service method', () => {
			var a = function() {};
			var b = function() {};
			port.registerService('fooService', '1.0', {
				a: a, b: b, c: 5
			});
			onRequest.should.have.been.calledWith(
				'service:fooService:1.0:a',
				a
			);
			onRequest.should.have.been.calledWith(
				'service:fooService:1.0:b',
				b
			);
		});

		it('should not add onRequest handler for non-function members', () => {
			port.registerService('fooService', '1.0', { a: 5 });
			onRequest.should.not.have.been.calledWith(
				'service:fooService:1.0:a',
				5
			);
		});

	});

	describe('request', () => {

		var sendMessage, initHashArrAndPush;

		beforeEach(() => {
			sendMessage = sinon.stub(port, 'sendMessage');
			initHashArrAndPush = sinon.stub(port, 'initHashArrAndPush');
		});

		afterEach(() => {
			sendMessage.restore();
			initHashArrAndPush.restore();
		});

		it('should throw if not connected', () => {
			expect(() => {
				port.request('foo');
			}).to.throw(Error, 'Cannot request() before connect() has completed');
		});

		it('should return a promise', () => {
			var promise = port.connect().request('foo');
			expect(promise).to.be.defined;
			expect(promise.then).to.be.defined;
		});

		it('should add to "pendingRequests"', () => {
			port.connect().request('foo');
			initHashArrAndPush.should.have.been.calledWith(
				port.pendingRequests,
				'foo'
			);
		});

		it('should send message', () => {
			port.connect().request('foo');
			sendMessage.should.have.been.calledWith(
				'req.foo',
				{ id: `${port.id}_1`, args: [] }
			);
		});

		it('should pass arguments', () => {
			port.connect().request('foo', 'bar', true, -3);
			sendMessage.should.have.been.calledWith(
				'req.foo',
				{ id: `${port.id}_1`, args: ['bar', true, -3] }
			);
		});

		it('should send each message with a new ID', () => {
			port.connect();
			port.request('foo');
			port.request('bar');
			sendMessage.should.have.been.calledWith('req.foo', { id: `${port.id}_1`, args: [] } );
			sendMessage.should.have.been.calledWith('req.bar', { id: `${port.id}_2`, args: [] } );
		});

	});

	describe('sendMessage', () => {

		it('should use "postMessage" to send', () => {
			port.sendMessage('blah', 'messagePayload');
			endpoint.postMessage.should.have.been.calledWith(
				{ key: 'frau.blah', payload: 'messagePayload' },
				targetOrigin
			);
		});

		it('should return "this"', () => {
			var val = port.sendMessage('foo', 'bar');
			expect(val).to.equal(port);
		});

	});

	describe('sendEvent', () => {

		var sendMessage;

		beforeEach(() => {
			sendMessage = sinon.stub(port, 'sendMessage').returns(14);
		});

		afterEach(() => {
			sendMessage.restore();
		});

		it('should throw if not connected', () => {
			expect(() => {
				port.sendEvent('foo', 'bar');
			}).to.throw(Error, 'Cannot sendEvent() before connect() has completed');
		});

		it('should "sendMessage" prepended with "evt"', () => {
			port.connect().sendEvent('foo');
			sendMessage.should.have.been.calledWith('evt.foo', []);
		});

		it('should pass arguments to "sendMessage"', () => {
			port.connect().sendEvent('foo', 'bar', true, -3);
			sendMessage.should.have.been.calledWith('evt.foo', ['bar', true, -3]);
		});

		it('should return result of "sendMessage"', () => {
			var val = port.connect().sendEvent('foo', 'bar');
			expect(val).to.equal(14);
		});

	});

	describe('sendRequestResponse', () => {

		var sendMessage;

		beforeEach(() => {
			sendMessage = sinon.stub(port, 'sendMessage');
		});

		afterEach(() => {
			sendMessage.restore();
		});

		[
			{name: 'value', val: 'foo', expect: 'foo'},
			{name: 'function', val: () => 'hello', expect: 'hello'},
			{name: 'promise', val: new Promise((resolve) => {
				resolve(true);
			}), expect: true},
			{name: 'function-promise', val: () => new Promise((resolve) => {
				resolve(49);
			}), expect: 49}
		].forEach((test) => {
			it(`should handle ${test.name}-based responses`, (done) => {
				port.requestHandlers.bar = test.val;
				port.waitingRequests.bar = [{id: 1, args:[]}];
				port.sendRequestResponse('bar');
				setTimeout(() => {
					sendMessage.should.have.been.calledWith(
						'res.bar',
						{id: 1, val: test.expect}
					);
					done();
				});
			});
		});

		it('should pass arguments to handler', (done) => {
			var handler = sinon.spy();
			port.requestHandlers.bar = handler;
			port.waitingRequests.bar = [{id: 1, args:['p1', 'p2', true]}];
			port.sendRequestResponse('bar');
			setTimeout(() => {
				handler.should.have.been.calledWith('p1', 'p2', true);
				done();
			});
		});

		it('should pass different arguments to handler', (done) => {
			var handler = sinon.spy();
			port.requestHandlers.bar = handler;
			port.waitingRequests.bar = [
				{id: 1, args:['p1', 'p2', true]},
				{id: 2, args:['p3', 'p4', false]}
			];
			port.sendRequestResponse('bar');
			setTimeout(() => {
				handler.should.have.been.calledWith('p1', 'p2', true);
				handler.should.have.been.calledWith('p3', 'p4', false);
				done();
			});
		});

		it('should send handler value to each waiting request', (done) => {
			port.requestHandlers.bar = 'hello';
			port.waitingRequests.bar = [{id: 1, args:[]}, {id: 2, args:[]}];
			port.sendRequestResponse('bar');
			setTimeout(() => {
				sendMessage.should.have.been.calledWith(
					'res.bar',
					{id: 1, val: 'hello'}
				);
				sendMessage.should.have.been.calledWith(
					'res.bar',
					{id: 2, val: 'hello'}
				);
				done();
			});
		});

		it('should not send a message if there is not handler', (done) => {
			port.waitingRequests.bar = [{id: 1, args: []}];
			port.sendRequestResponse('bar');
			setTimeout(() => {
				sendMessage.should.not.have.been.called;
				done();
			});
		});

		it('should not call handler or send a message if no waiting requests', (done) => {
			var handler = sinon.spy();
			port.requestHandlers.bar = handler;
			port.sendRequestResponse('bar');
			setTimeout(() => {
				handler.should.not.have.been.called;
				sendMessage.should.not.have.been.called;
				done();
			});
		});

		it('should propogate error to the client if handler throws', (done) => {
			const e = new TypeError('bad things');
			function handler () {
				throw e;
			}

			const reqType = 'bar';
			port.requestHandlers[reqType] = handler;
			port.waitingRequests[reqType] = [{ id: 1, args: [] }];

			port.sendRequestResponse(reqType);

			setTimeout(() => {
				sendMessage.should.have.been.calledWith('res.bar', {
					id: 1,
					err: fromError(e)
				});
				done();
			});
		});

		it('should propogate error to the client if handler returns rejected Promise', (done) => {
			const e = new TypeError('bad things');
			function handler () {
				return Promise.reject(e);
			}

			const reqType = 'bar';
			port.requestHandlers[reqType] = handler;
			port.waitingRequests[reqType] = [{ id: 1, args: [] }];

			port.sendRequestResponse(reqType);

			setTimeout(() => {
				sendMessage.should.have.been.calledWith('res.bar', {
					id: 1,
					err: fromError(e)
				});
				done();
			});
		});
	});

	describe('validateEvent', () => {
		[
			{endpoint: 'a', source: 'b', expect: false },
			{endpoint: 'a', source: 'a', targetOrigin: 'c', origin: 'd', expect: false },
			{endpoint: 'a', source: 'a', targetOrigin: 'c', origin: 'c', key: undefined, expect: false },
			{endpoint: 'a', source: 'a', targetOrigin: 'c', origin: 'c', key: 'invalid', expect: false },
			{endpoint: 'a', source: 'a', targetOrigin: 'c', origin: 'c', key: 'foo.frau.bar', expect: false },
			{endpoint: 'a', source: 'a', targetOrigin: 'c', origin: 'c', key: 'frau.valid', expect: true },
			{endpoint: 'a', source: 'a', targetOrigin: '*', origin: 'c', key: 'frau.valid', expect: true }
		].forEach((item, index) => {
			it(`should validate origin "${index}" to "${item.expect}"`, () => {
				var isValid = Port.validateEvent(
					item.targetOrigin,
					item.endpoint,
					{ source: item.source, origin: item.origin, data: { key: item.key } }
				);
				expect(isValid).to.equal(item.expect);
			});
		});
	});

});
