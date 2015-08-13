var chai = require('chai'),
	expect = chai.expect,
	sinon = require('sinon');

chai.should();
chai.use(require('sinon-chai'));

import Client from '../src/client';

describe('client', () => {

	var client, callback, sendEvent, sendMessage, clock;

	beforeEach(() => {
		global.window = {
			addEventListener: sinon.stub(),
			parent: {
				postMessage: sinon.stub()
			}
		};
		global.document = {
			body: {
				scrollHeight: 100
			}
		};
		client = new Client({syncTitle: false});
		sendEvent = sinon.stub(client, 'sendEvent');
		sendMessage = sinon.stub(client, 'sendMessage');
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
			sendMessage.should.have.been.calledWith('evt.ready');
		});

	});

	describe('navigate', () => {

		it('should fire "navigate" event', (done) => {
			client.connect().then(() => {
				client.navigate('some-url');
				sendEvent.should.have.been.calledWith('navigate', 'some-url');
				done();
			});
		});

	});

});
