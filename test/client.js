const
	expect = require('chai').expect,
	sinon = require('sinon');

require('chai')
	.use(require('sinon-chai'))
	.should();

const Client = require('../client');

describe('client', () => {

	var client, sendEvent, sendMessage, clock;

	beforeEach(() => {
		global.window = {
			addEventListener: sinon.stub(),
			parent: {
				postMessage: sinon.stub()
			}
		};
		global.document = {
			addEventListener: sinon.stub(),
			body: {
				scrollHeight: 100
			},
			createElement: sinon.stub().returns({ src:'' }),
			head: {
				appendChild: sinon.stub()
			}
		};
		client = new Client({ syncLang: false, syncTitle: false });
		sendEvent = sinon.stub(client, 'sendEvent');
		sendMessage = sinon.stub(client, '_sendMessage');
		clock = sinon.useFakeTimers();
	});

	afterEach(() => {
		sendEvent.restore();
		sendMessage.restore();
		clock.restore();
	});

	describe('connect', () => {

		var open;

		beforeEach(() => {
			open = sinon.stub(client, 'open');
		});

		afterEach(() => {
			open.restore();
		});

		it('should return a promise', () => {
			var p = client.connect();
			expect(p).to.be.defined;
			expect(p.then).to.be.defined;
		});

		it('should resolve with the client', (done) => {
			client.connect().then((c) => {
				expect(c).to.equal(client);
				done();
			});
		});

		it('should open the port', () => {
			client.connect();
			open.should.have.been.called;
		});

		it('should send the "ready" event', () => {
			client.connect();
			sendMessage.should.have.been.calledWith('evt', 'ready');
		});

	});

});
