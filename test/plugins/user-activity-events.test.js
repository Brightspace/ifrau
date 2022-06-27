import chai from 'chai';
import { recordUserEvents } from '../../plugins/user-activity-events/client.js';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

chai.use(sinonChai).should();

const sendEvent = function() {};
const MockClient = function() {
	return { sendEvent: sendEvent };
};

describe('user-activity-events', () => {

	beforeEach(() => {
		global.document = {};
	});

	describe('client', () => {

		let client;
		beforeEach(() => {
			global.document = {};
			global.window = {};
			client = new MockClient();
		});

		describe('user activity events client', () => {
			let onClose;
			let addEventListener;
			let removeEventListener;
			let sendEvent;
			beforeEach(() => {
				addEventListener = sinon.spy();
				removeEventListener = sinon.spy();
				onClose = sinon.spy();
				sendEvent = sinon.spy();
				global.document.addEventListener = addEventListener;
				global.document.removeEventListener = removeEventListener;
				client.sendEvent = sendEvent;
				client.onClose = onClose;
			});

			it('should add a click event listener which triggers a userIsActiveEvent when called', (done) => {
				recordUserEvents(client);
				addEventListener.should.have.been.calledWith('click');
				//call the actual event handler function and test if it is actually triggering the userIsActive event when it is called
				addEventListener.getCall(0).args[1].apply();
				sendEvent.should.have.been.calledWith('userIsActive');
				done();
			});

			it('should add a keydown event listener', (done) => {
				recordUserEvents(client);
				addEventListener.should.have.been.calledWith('keydown');
				//call the actual event handler function and test if it is actually triggering the userIsActive event when it is called
				addEventListener.getCall(1).args[1].apply();
				sendEvent.should.have.been.calledWith('userIsActive');
				done();
			});

			it('should add a click event listener which throttles clicks to only send periodically', (done) => {
				recordUserEvents(client);
				addEventListener.should.have.been.calledWith('click');
				//call the actual event handler function and test if it is actually triggering the userIsActive event when it is called
				addEventListener.getCall(0).args[1].apply();
				addEventListener.getCall(0).args[1].apply();
				addEventListener.getCall(0).args[1].apply();
				sendEvent.should.have.callCount(1);
				done();
			});

			it('should add on-close handler', (done) => {
				recordUserEvents(client);
				onClose.should.have.been.called;
				done();
			});

			it('should remove event listeners when client is closed ', (done) => {
				recordUserEvents(client);
				onClose.args[0][0]();
				removeEventListener.should.have.been.calledWith('click');
				removeEventListener.should.have.been.calledWith('keydown');
				done();
			});
		});

		describe('user activity events with fake-waiting for throttle buffer period', () => {
			let clock;
			let addEventListener;
			let sendEvent;
			let onClose;
			beforeEach(() => {
				const now = Date.now();
				clock = sinon.useFakeTimers(now);
				addEventListener = sinon.spy();
				sendEvent = sinon.spy();
				onClose = sinon.spy();
				global.document.addEventListener = addEventListener;
				client.sendEvent = sendEvent;
				client.onClose = onClose;
			});
			afterEach(() => {
				clock.restore();
			});
			it('should add an click event listener which throttles clicks to only send periodically', (done) => {
				recordUserEvents(client);
				const throttledSendEvent = addEventListener.getCall(0).args[1];

				// should call immediately
				throttledSendEvent();
				sendEvent.should.have.callCount(1);

				// shouldn't call after the timeout, because we haven't called again
				clock.tick(10000);
				sendEvent.should.have.callCount(1);

				// should call immediately, now that timeout has passed
				throttledSendEvent();
				sendEvent.should.have.callCount(2);

				// shouldn't call during the timeout, even though we called
				throttledSendEvent();
				throttledSendEvent();
				throttledSendEvent();
				sendEvent.should.have.callCount(2);
				clock.tick(1000);
				sendEvent.should.have.callCount(2);
				clock.tick(1000);
				sendEvent.should.have.callCount(2);

				// should call after the timeout, because we called during it
				clock.tick(8000);
				sendEvent.should.have.callCount(3);

				// shouldn't call until the timeout is over again
				throttledSendEvent();
				throttledSendEvent();
				throttledSendEvent();
				sendEvent.should.have.callCount(3);
				clock.tick(1000);
				sendEvent.should.have.callCount(3);
				clock.tick(1000);
				sendEvent.should.have.callCount(3);
				clock.tick(8000);
				sendEvent.should.have.callCount(4);
				done();
			});
		});
	});

});
