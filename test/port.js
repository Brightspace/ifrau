'use strict';

const
	chai = require('chai'),
	expect = chai.expect,
	sinon = require('sinon');

chai.should();
chai.use(require('sinon-chai'));

const
	fromError = require('../src/port/transform-error').fromError,
	Port = require('../src/port'),
	RequestTypeError = require('../src/port/request-type-error');

var targetOrigin = 'http://cdn.com/app/index.html';

describe('port', () => {

	var port, endpoint;

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
				.should.have.been.calledWith('message', port._receiveMessage );
		});

		it('should disconnect port', () => {
			port.open();
			port.close();
			expect(port._isConnected).to.be.false;
		});

		it('should call onClose callbacks', () => {
			let cb = sinon.spy();
			port.onClose(cb);
			port.open();
			port.close();
			expect(cb).to.have.been.calledOnce;
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
			var p = new Port(endpoint, targetOrigin, { debug: false });
			p.debug('hello');
			consoleSpy.should.not.have.been.called;
		});

		it('should write to console when enabled', () => {
			var p = new Port(endpoint, targetOrigin, { debug: true });
			p.debug('hello');
			consoleSpy.should.have.been.calledWith('hello');
		});

	});

	describe('getService', () => {

		var request;

		beforeEach(() => {
			request = sinon.stub(port, 'request');
			request.withArgs('service:foo:1.0').returns(
				new Promise((resolve/*, reject*/) => {
					setTimeout(() => {
						resolve(['a', 'b']);
					});
				})
			);
			request.withArgs('service:foo:1.0:a', '1', true).returns(5);
		});

		afterEach(() => {
			request.restore();
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
					request.should.have.been.calledWith('service:foo:1.0');
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
					request.should.have.been.calledWith('service:foo:1.0:a', '1', true);
					expect(result).to.eql(5);
					done();
				});
		});

	});

	describe('initHashArrAndPush', () => {

		it('should create array entry if it does not exist', () => {
			var hash = {};
			port._initHashArrAndPush(hash, 'foo', 'bar');
			expect(hash.foo).to.eql(['bar']);
		});

		it('should append to existing entry', () => {
			var hash = { foo: ['bar'] };
			port._initHashArrAndPush(hash, 'foo', 'hello');
			expect(hash.foo).to.eql([ 'bar', 'hello']);
		});

	});

	describe('onEvent', () => {

		var _initHashArrAndPush, debug;

		beforeEach(() => {
			_initHashArrAndPush = sinon.stub(port, '_initHashArrAndPush');
			debug = sinon.stub(port, 'debug');
		});

		afterEach(() => {
			_initHashArrAndPush.restore();
			debug.restore();
		});

		it('should add to eventHandlers', () => {
			var handler = () => {};
			port.onEvent('foo', handler);
			_initHashArrAndPush.should.have.been.calledWith(
				port._eventHandlers, 'foo', handler
			);
		});

		it('should return "this"', () => {
			var p = port.onEvent('foo', () => {});
			expect(p).to.equal(port);
		});

		it('should debug if already connected', () => {
			port.connect();
			port.onEvent('foo', () => {});
			debug.should.have.been.called;
		});

	});

	describe('onRequest', () => {

		var _sendRequestResponse;

		beforeEach(() => {
			_sendRequestResponse = sinon.stub(port, '_sendRequestResponse');
		});

		afterEach(() => {
			_sendRequestResponse.restore();
		});

		it('should add to _requestHandlers', () => {
			var handler = () => {};
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

	describe('_receiveEvent', () => {

		it('should not call handlers for different events', () => {
			var handler = sinon.spy();
			port.onEvent('foo', handler);
			port._receiveEvent('bar');
			handler.should.not.have.been.called;
		});

		it('should pass payload as arguments to handler', () => {
			var handler = sinon.spy();
			port.onEvent('foo', handler);
			port._receiveEvent('foo', ['bar', true, -2]);
			handler.should.have.been.calledWith('bar', true, -2);
		});

		it('should call each handler for the event with payload', () => {
			var handler1 = sinon.spy();
			var handler2 = sinon.spy();
			port.onEvent('foo', handler1)
				.onEvent('foo', handler2);
			port._receiveEvent('foo', ['bar']);
			handler1.should.have.been.calledWith('bar');
			handler2.should.have.been.calledWith('bar');
		});

	});

	describe('receiveMessage', () => {

		var _receiveEvent, _receiveRequest, _receiveRequestResponse;

		beforeEach(() => {
			_receiveEvent = sinon.stub(port, '_receiveEvent');
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
			_receiveEvent.should.not.have.been.called;
			_receiveRequest.should.not.have.been.called;
			_receiveRequestResponse.should.not.have.been.called;
		});

		it('should not handle unrecognized message types', () => {
			port._receiveMessage({
				source: endpoint,
				origin: targetOrigin,
				data: { key: 'frau.foo.bar' }
			});
			_receiveEvent.should.not.have.been.called;
			_receiveRequest.should.not.have.been.called;
			_receiveRequestResponse.should.not.have.been.called;
		});

		it('should pass "evt" messages to "_receiveEvent"', () => {
			port._receiveMessage({
				source: endpoint,
				origin: targetOrigin,
				data: { key: 'frau.evt.myEvent', payload: ['bar', false] }
			});
			_receiveEvent.should.have.been.calledWith('myEvent', ['bar', false]);
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

		var _sendRequestResponse, _initHashArrAndPush;

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
			var req = {
				resolve: sinon.spy(),
				reject: sinon.spy()
			};
			port._pendingRequests.foo = [req];
			port._receiveRequestResponse('bar', {id: port.requestId});
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
			port._pendingRequests.foo = [req1, req2];
			port._receiveRequestResponse('foo', {id: 2});
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

		var _sendMessage, _initHashArrAndPush;

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
			var promise = port.connect().request('foo');
			expect(promise).to.be.defined;
			expect(promise.then).to.be.defined;
		});

		it('should add to "_pendingRequests"', () => {
			port.connect().request('foo');
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
			port.connect().request('foo');
			_sendMessage.should.have.been.calledWith(
				'req',
				'foo',
				{ id: `${port._id}_1`, args: [] }
			);
		});

		it('should pass arguments', () => {
			port.connect().request('foo', 'bar', true, -3);
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
			_sendMessage.should.have.been.calledWith('req', 'foo', { id: `${port._id}_1`, args: [] } );
			_sendMessage.should.have.been.calledWith('req', 'bar', { id: `${port._id}_2`, args: [] } );
		});

	});

	describe('_sendMessage', () => {

		it('should use "postMessage" to send', () => {
			port._sendMessage('blah', 'blerg', 'messagePayload');
			endpoint.postMessage.should.have.been.calledWith(
				{ key: 'frau.blah.blerg', payload: 'messagePayload' },
				targetOrigin
			);
		});

		it('should return "this"', () => {
			var val = port._sendMessage('foo', 'bar', 'baz');
			expect(val).to.equal(port);
		});

	});

	describe('sendEvent', () => {

		var _sendMessage;

		beforeEach(() => {
			_sendMessage = sinon.stub(port, '_sendMessage').returns(14);
		});

		afterEach(() => {
			_sendMessage.restore();
		});

		it('should queue if not connected', () => {
			port.sendEvent('foo', 'bar');
			_sendMessage.should.not.have.been.called;
			expect(port._connectQueue.length).to.equal(1);
		});

		it('should send queued messages after connect', () => {
			port.sendEvent('foo', 'bar').connect();
			_sendMessage.should.have.been.calledWith('evt', 'foo', ['bar']);
		});

		it('should "_sendMessage" prepended with "evt"', () => {
			port.connect().sendEvent('foo');
			_sendMessage.should.have.been.calledWith('evt', 'foo', []);
		});

		it('should pass arguments to "_sendMessage"', () => {
			port.connect().sendEvent('foo', 'bar', true, -3);
			_sendMessage.should.have.been.calledWith('evt', 'foo', ['bar', true, -3]);
		});

		it('should return result of "_sendMessage"', () => {
			var val = port.connect().sendEvent('foo', 'bar');
			expect(val).to.equal(14);
		});

	});

	describe('_sendRequestResponse', () => {

		var _sendMessage;

		beforeEach(() => {
			_sendMessage = sinon.stub(port, '_sendMessage');
		});

		afterEach(() => {
			_sendMessage.restore();
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
				port._requestHandlers.bar = test.val;
				port._waitingRequests.bar = [{id: 1, args:[]}];
				port._sendRequestResponse('bar');
				setTimeout(() => {
					_sendMessage.should.have.been.calledWith(
						'res',
						'bar',
						{id: 1, val: test.expect}
					);
					done();
				});
			});
		});

		it('should pass arguments to handler', (done) => {
			var handler = sinon.spy();
			port._requestHandlers.bar = handler;
			port._waitingRequests.bar = [{id: 1, args:['p1', 'p2', true]}];
			port._sendRequestResponse('bar');
			setTimeout(() => {
				handler.should.have.been.calledWith('p1', 'p2', true);
				done();
			});
		});

		it('should pass different arguments to handler', (done) => {
			var handler = sinon.spy();
			port._requestHandlers.bar = handler;
			port._waitingRequests.bar = [
				{id: 1, args:['p1', 'p2', true]},
				{id: 2, args:['p3', 'p4', false]}
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
			port._waitingRequests.bar = [{id: 1, args:[]}, {id: 2, args:[]}];
			port._sendRequestResponse('bar');
			setTimeout(() => {
				_sendMessage.should.have.been.calledWith(
					'res',
					'bar',
					{id: 1, val: 'hello'}
				);
				_sendMessage.should.have.been.calledWith(
					'res',
					'bar',
					{id: 2, val: 'hello'}
				);
				done();
			});
		});

		it('should propogate error to the client if there is no handler', (done) => {
			const e = new RequestTypeError('bar');

			port._waitingRequests.bar = [{id: 1, args: []}];
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
			var handler = sinon.spy();
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

	describe('use', () => {

		it('should call plugin with port', () => {
			const plugin = sinon.spy();
			port.use(plugin);
			plugin.should.have.been.calledWith(port);
		});

		it('should return port', () => {
			const result = port.use(() => {});
			expect(result).to.equal(port);
		});

	});
});
