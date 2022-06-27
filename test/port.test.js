import chai, { expect } from 'chai';
import { Port } from '../port/port.js';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

chai.use(sinonChai).should();

const targetOrigin = 'http://cdn.com/app/index.html';

describe('port', () => {

	let port, endpoint;

	beforeEach(async() => {
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
				.should.have.been.calledWith('message');
		});

		it('should disconnect port', () => {
			port.open();
			port.close();
			expect(port._isConnected).to.be.false;
		});

		it('should call onClose callbacks', () => {
			const cb = sinon.spy();
			port.onClose(cb);
			port.open();
			port.close();
			expect(cb).to.have.been.calledOnce;
		});

	});

	describe('connect', () => {

		it('should return a  promise', () => {
			const p = port.connect();
			expect(p).to.not.be.undefined;
			expect(p.then).to.not.be.undefined;
		});

		it('should wait for plugin startup before resolving', (done) => {
			let resolvePluginStartup;
			port.use((/*port*/) => {
				return new Promise((resolve) => {
					resolvePluginStartup = resolve;
				});
			});

			let connectHasResolved = false;
			port.connect().then(() =>  connectHasResolved = true);

			setTimeout(() => {
				expect(connectHasResolved).to.be.false;

				resolvePluginStartup();

				setTimeout(() => {
					expect(connectHasResolved).to.be.true;
					done();
				});
			});
		});

		it('should reject if plugin startup rejects', () => {
			let expectedError;
			port.use((/*port*/) => {
				expectedError = new Error();
				return Promise.reject(expectedError);
			});

			return port.connect().then(
				() => {
					throw new Error('should have rejected');
				},
				(e) => {
					expect(e).to.equal(expectedError);
				}
			);
		});

		it('should fire off connect queue before waiting', (done) => {
			let resolvePluginStartup;
			port.use((/*port*/) => {
				return new Promise((resolve) => {
					resolvePluginStartup = resolve;
				});
			});

			let connectQueueFlushed = false;
			port._connectQueue.push(() => connectQueueFlushed = true);

			const p = port.connect();

			expect(connectQueueFlushed).to.be.true;

			resolvePluginStartup();

			p.then(() => {
				done();
			});
		});

	});

	describe('debug', () => {

		let consoleSpy;

		beforeEach(() => {
			consoleSpy = sinon.spy(global.console, 'log');
		});

		afterEach(() => {
			consoleSpy.restore();
		});

		it('should not write to console by default', () => {
			const p = new Port(endpoint, targetOrigin);
			p.debug('hello');
			consoleSpy.should.not.have.been.called;
		});

		it('should not write to console when disabled', () => {
			const p = new Port(endpoint, targetOrigin, { debug: false });
			p.debug('hello');
			consoleSpy.should.not.have.been.called;
		});

		it('should write to console when enabled', () => {
			const p = new Port(endpoint, targetOrigin, { debug: true });
			p.debug('hello');
			consoleSpy.should.have.been.calledWith('hello');
		});

	});

	describe('initHashArrAndPush', () => {

		it('should create array entry if it does not exist', () => {
			const hash = {};
			port._initHashArrAndPush(hash, 'foo', 'bar');
			expect(hash.foo).to.eql(['bar']);
		});

		it('should append to existing entry', () => {
			const hash = { foo: ['bar'] };
			port._initHashArrAndPush(hash, 'foo', 'hello');
			expect(hash.foo).to.eql([ 'bar', 'hello']);
		});

	});

	describe('onEvent', () => {

		let _initHashArrAndPush, debug;

		beforeEach(() => {
			_initHashArrAndPush = sinon.stub(port, '_initHashArrAndPush');
			debug = sinon.stub(port, 'debug');
		});

		afterEach(() => {
			_initHashArrAndPush.restore();
			debug.restore();
		});

		it('should add to eventHandlers', () => {
			const handler = () => {};
			port.onEvent('foo', handler);
			_initHashArrAndPush.should.have.been.calledWith(
				port._eventHandlers, 'foo', handler
			);
		});

		it('should return "this"', () => {
			const p = port.onEvent('foo', () => {});
			expect(p).to.equal(port);
		});

		it('should debug if already connected', () => {
			port.connect();
			port.onEvent('foo', () => {});
			debug.should.have.been.called;
		});

	});

	describe('open', () => {

		it('should listen for "message" events', () => {
			port.open();
			global.window.addEventListener
				.should.have.been.calledWith('message');
		});

		it('should return "this"', () => {
			const val = port.open();
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
			const handler = sinon.spy();
			port.onEvent('foo', handler);
			port._receiveEvent('bar');
			handler.should.not.have.been.called;
		});

		it('should pass payload as arguments to handler', () => {
			const handler = sinon.spy();
			port.onEvent('foo', handler);
			port._receiveEvent('foo', ['bar', true, -2]);
			handler.should.have.been.calledWith('bar', true, -2);
		});

		it('should call each handler for the event with payload', () => {
			const handler1 = sinon.spy();
			const handler2 = sinon.spy();
			port.onEvent('foo', handler1)
				.onEvent('foo', handler2);
			port._receiveEvent('foo', ['bar']);
			handler1.should.have.been.calledWith('bar');
			handler2.should.have.been.calledWith('bar');
		});

	});

	describe('receiveMessage', () => {

		let _receiveEvent;

		beforeEach(() => {
			_receiveEvent = sinon.stub(port, '_receiveEvent');
		});

		afterEach(() => {
			_receiveEvent.restore();
		});

		it('should not handle invalid events', () => {
			port._receiveMessage({ source: 'evil' });
			_receiveEvent.should.not.have.been.called;
		});

		it('should not handle unrecognized message types', () => {
			port._receiveMessage({
				source: endpoint,
				origin: targetOrigin,
				data: { key: 'frau.foo.bar' }
			});
			_receiveEvent.should.not.have.been.called;
		});

		it('should pass "evt" messages to "_receiveEvent"', () => {
			port._receiveMessage({
				source: endpoint,
				origin: targetOrigin,
				data: { key: 'frau.evt.myEvent', payload: ['bar', false] }
			});
			_receiveEvent.should.have.been.calledWith('myEvent', ['bar', false]);
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
			const val = port._sendMessage('foo', 'bar', 'baz');
			expect(val).to.equal(port);
		});

	});

	describe('sendEvent', () => {

		let _sendMessage;

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
			port.connect();
			port.sendEvent('foo');
			_sendMessage.should.have.been.calledWith('evt', 'foo', []);
		});

		it('should pass arguments to "_sendMessage"', () => {
			port.connect();
			port.sendEvent('foo', 'bar', true, -3);
			_sendMessage.should.have.been.calledWith('evt', 'foo', ['bar', true, -3]);
		});

		it('should return result of "_sendMessage"', () => {
			port.connect();
			const val = port.sendEvent('foo', 'bar');
			expect(val).to.equal(14);
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
