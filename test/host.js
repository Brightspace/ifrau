var chai = require('chai'),
	expect = chai.expect,
	sinon = require('sinon');

chai.should();
chai.use(require('sinon-chai'));

import Host from '../src/host';

describe('host', () => {

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
					var host = new Host(() => null, src);
				}).to.throw(Error, /Unable to extract origin/);
			});
		});

		it('should throw if parent missing', () => {
			expect(() => {
				var host = new Host(() => null, 'http://cdn.com/foo.html');
			}).to.throw(Error, /Could not find parent/);
		});

	});

	describe('connect', () => {

		var host, callback, onEvent, sendEventRaw, element;

		beforeEach(() => {
			global.window = {
				addEventListener: sinon.stub(),
				location: { origin: 'origin' }
			};
			global.document = {
				createElement: sinon.stub().returns({style:{}}),
				getElementById: sinon.stub().returns()
			};
			global.localStorage = {
				'XSRF.Token': 'token'
			};
			callback = sinon.spy();
			element = { appendChild: sinon.spy() };
			host = new Host(() => element, 'http://cdn.com/app/index.html', callback);
			onEvent = sinon.spy(host, 'onEvent');
			sendEventRaw = sinon.stub(host, 'sendEventRaw');
		});

		afterEach(() => {
			onEvent.restore();
			sendEventRaw.restore();
		});

		it('should return a promise', () => {
			var p = host.connect();
			expect(p).to.be.defined;
			expect(p.then).to.be.defined;
		});

		it('should open the port', () => {
			host.connect();
			global.window.addEventListener.should.have.been.called;
		});

		it('should resolve promise when "ready" event is received', (done) => {
			host.connect().then(() => {
				sendEventRaw.should.have.been.calledWith(
					'csrf',
					[
						'origin',
						'token'
					]
				);
				done();
			});
			host.receiveEvent('ready');
		});

		['ready', 'height', 'title', 'navigate'].forEach((evt) => {
			it(`should register for the "${evt}" event`, () => {
				host.connect();
				onEvent.should.have.been.calledWith(evt);
			});
		});

	});

});
