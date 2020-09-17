const
	expect = require('chai').expect,
	sinon = require('sinon');

require('chai')
	.use(require('sinon-chai'))
	.should();

require('./mock-dom');

const Host = require('../host');

describe('host', () => {

	var element;

	beforeEach(() => {
		global.window = {
			location: { protocol: 'https:' }
		};
		global.document = {
			createElement: sinon.stub().returns({
				style: {},
				tagName: 'iframe',
				contentWindow: {
					postMessage: function() {}
				},
				addEventListener: function() {}
			})
		};
		element = { appendChild: sinon.spy() };
	});

	describe('constructor', () => {

		[
			undefined,
			null,
			'',
			'foo',
			'ftp://foo.com',
			'foo.com'
		].forEach((src) => {
			it(`should throw invalid origin "${src}"`, () => {
				expect(() => {
					new Host(() => null, src);
				}).to.throw(Error, /Unable to extract origin/);
			});
		});

		[
			'http://foo.com',
			'https://foo.com',
			'HTTP://foo.com'
		].forEach((src) => {
			it(`should not throw for valid origin "${src}"`, () => {
				var host = new Host(() => element, src);
				expect(host._targetOrigin).to.equal(src);
			});
		});

		it('should resolve protocol-relative origin', () => {
			var host = new Host(() => element, '//foo.com');
			expect(host._targetOrigin).to.equal('https://foo.com');
		});

		it('should throw if parent missing', () => {
			expect(() => {
				new Host(() => null, 'http://cdn.com/foo.html');
			}).to.throw(Error, /Could not find parent/);
		});

	});

	describe('methods', () => {

		let host, callback, onEvent, sendEvent;

		beforeEach(() => {
			global.window.addEventListener = sinon.stub();
			global.window.location.origin = 'origin';
			global.window.removeEventListener = sinon.stub();
			global.document.getElementById = sinon.stub().returns();
			global.document.location = { href: 'url' };
			callback = sinon.spy();
			host = new Host(() => element, 'http://cdn.com/app/index.html', callback);
			onEvent = sinon.spy(host, 'onEvent');
			sendEvent = sinon.stub(host, 'sendEvent');
		});

		afterEach(() => {
			onEvent.restore();
			sendEvent.restore();
		});

		describe('connect', () => {

			it('should return a promise', () => {
				var p = host.connect();
				expect(p).to.be.defined;
				expect(p.then).to.be.defined;
			});

			it('should resolve with the host', (done) => {
				host.connect().then((h) => {
					expect(h).to.equal(host);
					done();
				});
				host._receiveEvent('ready');
			});

			it('should open the port', () => {
				host.connect();
				global.window.addEventListener.should.have.been.called;
			});

			it('should resolve promise when "ready" event is received', (done) => {
				host.connect().then(() => done());
				host._receiveEvent('ready');
			});

			it('should register for the "ready" event', () => {
				host.connect();
				onEvent.should.have.been.calledWith('ready');
			});

			it('should not error when client connects after initial client', (done) => {
				host
					.connect()
					.then(() => {
						host._receiveEvent('ready');
					})
					.then(done, done);
				host._receiveEvent('ready');
			});
		});

	});
});
