var chai = require('chai'),
	expect = chai.expect,
	sinon = require('sinon');

chai.should();
chai.use(require('sinon-chai'));

import Port from '../src/port';

var targetOrigin = '*';

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

		it('should stop listening for "message" events', () => {
			port.close();
			global.window.removeEventListener
				.should.have.been.calledWith('message', port.receiveMessage );
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
			port.debug('hello');
			consoleSpy.should.not.have.been.called;
		});

		it('should not write to console when disabled', () => {
			port.debugEnabled = false;
			port.debug('hello');
			consoleSpy.should.not.have.been.called;
		});

		it('should write to console when enabled', () => {
			port.debugEnabled = true;
			port.debug('hello');
			consoleSpy.should.have.been.calledWith('hello');
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

		[
			{ source: 'evil', data: {} },
			{ data: {} },
			{ data: { key: 'whateves' } },
			{ data: { key: 'frau.foo.bar' } }
		].forEach((evt, index) => {
			it(`should not handle malformed events ${index}`, () => {
				evt.source = evt.source || endpoint;
				port.receiveMessage(evt);
				receiveEvent.should.not.have.been.called;
				receiveRequest.should.not.have.been.called;
				receiveRequestResponse.should.not.have.been.called;
			});
		});

		it('should pass "evt" messages to "receiveEvent"', () => {
			port.receiveMessage({
				source: endpoint,
				data: { key: 'frau.evt.myEvent', payload: 'bar' }
			});
			receiveEvent.should.have.been.calledWith('myEvent', 'bar');
		});

		it('should pass "req" messages to "receiveRequest"', () => {
			port.receiveMessage({
				source: endpoint,
				data: { key: 'frau.req.myRequest', payload: 'foo' }
			});
			receiveRequest.should.have.been.calledWith('myRequest', 'foo');
		});

		it('should pass "res" messages to "receiveRequestResponse"', () => {
			port.receiveMessage({
				source: endpoint,
				data: { key: 'frau.res.myResponse', payload: 23 }
			});
			receiveRequestResponse
				.should.have.been.calledWith('myResponse', 23);
		});

	});

	describe('receiveEvent', () => {

		it('should not call handlers for different events', () => {
			var handler = sinon.spy();
			port.onEvent('foo', handler);
			port.receiveEvent('bar');
			handler.should.not.have.been.called;
		});

		it('should call each handler for the event with payload', () => {
			var handler1 = sinon.spy();
			var handler2 = sinon.spy();
			port.onEvent('foo', handler1)
				.onEvent('foo', handler2);
			port.receiveEvent('foo', 'bar');
			handler1.should.have.been.calledWith('bar');
			handler2.should.have.been.calledWith('bar');
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
			port.receiveRequest('foo', { id: 'rId' });
			initHashArrAndPush.should.have.been.calledWith(
				port.waitingRequests, 'foo', 'rId'
			);
		});

		it('should attempt to send response', () => {
			port.receiveRequest('foo', { id: 'rId' });
			sendRequestResponse.should.have.been.calledWith('foo');
		});

	});

	describe('receiveRequestResponse', () => {

		it('should ignore responses which aren\'t pending', (done) => {
			var req = {
				promise: sinon.spy()
			};
			port.pendingRequests.foo = [req];
			port.receiveRequestResponse('bar', {id: port.requestId});
			setTimeout(() => {
				req.promise.should.not.have.been.called; done(); }
			);
		});

		it('should only respond to request with matching id', (done) => {
			var req1 = {
				id: 1,
				promise: sinon.spy()
			};
			var req2 = {
				id: 2,
				promise: sinon.spy()
			};
			port.pendingRequests.foo = [req1, req2];
			port.receiveRequestResponse('foo', {id: 2});
			setTimeout(() => {
				req1.promise.should.not.have.been.called;
				req2.promise.should.have.been.calledOnce;
				done();
			});
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

		it('should return a promise', () => {
			var promise = port.request('foo');
			expect(promise).to.be.defined;
			expect(promise.then).to.be.defined;
		});

		it('should add to "pendingRequests"', () => {
			port.request('foo');
			initHashArrAndPush.should.have.been.calledWith(
				port.pendingRequests,
				'foo'
			);
		});

		it('should send message', () => {
			port.request('foo');
			sendMessage.should.have.been.calledWith('req.foo', { id: 1 } );
		});

		it('should send each message with a new ID', () => {
			port.request('foo');
			port.request('bar');
			sendMessage.should.have.been.calledWith('req.foo', { id: 1 } );
			sendMessage.should.have.been.calledWith('req.bar', { id: 2 } );
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

		it('should "sendMessage" prepended with "evt"', () => {
			port.sendEvent('foo', 'bar');
			sendMessage.should.have.been.calledWith('evt.foo', 'bar');
		});

		it('should return result of "sendMessage"', () => {
			var val = port.sendEvent('foo', 'bar');
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

		it('should send handler value to each waiting request', (done) => {
			port.requestHandlers.bar = () => 'hello';
			port.waitingRequests.bar = [1, 2];
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

		it('should handle promise-based responses', (done) => {
			port.requestHandlers.bar = () => new Promise((resolve) => {
				resolve(49);
			});
			port.waitingRequests.bar = [1];
			port.sendRequestResponse('bar');
			setTimeout(() => {
				sendMessage.should.have.been.calledWith(
					'res.bar',
					{id: 1, val: 49}
				);
				done();
			});
		});

		it('should not send a message if there is not handler', (done) => {
			port.waitingRequests.bar = [1];
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

	});

});
