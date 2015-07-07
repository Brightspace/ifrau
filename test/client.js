var chai = require('chai'),
	expect = chai.expect,
	sinon = require('sinon');

chai.should();
chai.use(require('sinon-chai'));

import Client from '../src/client';

describe('client', () => {

	var client, callback, sendEvent, sendEventRaw, clock;

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
		client = new Client();
		sendEvent = sinon.stub(client, 'sendEvent');
		sendEventRaw = sinon.stub(client, 'sendEventRaw');
		clock = sinon.useFakeTimers();
	});

	afterEach(() => {
		sendEvent.restore();
		sendEventRaw.restore();
		clock.restore();
	});

	describe('adjustHeight', () => {

		it('should not send event if height has not changed', () => {
			global.document.body.scrollHeight = 0;
			client.adjustHeight();
			sendEventRaw.should.not.have.been.called;
		});

		it('should send event if height has changed', () => {
			global.document.body.scrollHeight = 200;
			client.adjustHeight();
			sendEventRaw.should.have.been.calledWith('height', [200]);
		});

	});

	describe('connect', () => {

		var adjustHeight, open;

		beforeEach(() => {
			adjustHeight = sinon.stub(client, 'adjustHeight');
			open = sinon.stub(client, 'open');
		});

		afterEach(() => {
			adjustHeight.restore();
			open.restore();
		});

		it('should return a promise', () => {
			var p = client.connect();
			expect(p).to.be.defined;
			expect(p.then).to.be.defined;
		});

		it('should open the port', () => {
			client.connect();
			open.should.have.been.called;
		});

		it('should send the "ready" event', () => {
			client.connect();
			sendEventRaw.should.have.been.calledWith('ready');
		});

		it('should adjustHeight every 100ms', () => {
			client.connect();
			adjustHeight.should.not.have.been.called;
			clock.tick(100);
			adjustHeight.should.have.been.calledOnce;
			clock.tick(100);
			adjustHeight.should.have.been.calledTwice;
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

	describe('setTitle', () => {

		it('should fire "title" event', (done) => {
			client.connect().then(() => {
				client.setTitle('my title');
				sendEvent.should.have.been.calledWith('title', 'my title');
				done();
			});
		});

	});

});
