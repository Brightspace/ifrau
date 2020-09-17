const
	sinon = require('sinon');

require('chai')
	.use(require('sinon-chai'))
	.should();

const
	clientUserActivityEvents = require('../../src/plugins/user-activity-events/client');

const sendEvent = function() {};
const MockClient = function() {
	return { sendEvent: sendEvent };
};

describe('user-activity-events', () => {

	beforeEach(() => {
		global.document = {
		};
	});

	describe('client', () => {

		var client;
		beforeEach(() => {
			global.window = {};
			client = new MockClient();
		});

		afterEach(() => {
		});

		describe('user activity events client', () => {
			var onClose;
			var addEventListener;
			var removeEventListener;
			var sendEvent;
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

			it('should add an click event listener which triggers a userIsActiveEvent when called', () => {
				clientUserActivityEvents(client);
				addEventListener.should.have.been.calledWith('click');
				//call the actual event handler function and test if it is actually triggering the userIsActive event when it is called
				addEventListener.getCall(0).args[1].apply();
				sendEvent.should.have.been.calledWith('userIsActive');
			});

			it('should add an keydown event listener', () => {
				clientUserActivityEvents(client);
				addEventListener.should.have.been.calledWith('keydown');
				//call the actual event handler function and test if it is actually triggering the userIsActive event when it is called
				addEventListener.getCall(1).args[1].apply();
				sendEvent.should.have.been.calledWith('userIsActive');
			});

			it('should add an click event listener which throttles clicks to only send periodically', () => {
				clientUserActivityEvents(client);
				addEventListener.should.have.been.calledWith('click');
				//call the actual event handler function and test if it is actually triggering the userIsActive event when it is called
				addEventListener.getCall(0).args[1].apply();
				addEventListener.getCall(0).args[1].apply();
				addEventListener.getCall(0).args[1].apply();
				sendEvent.should.have.callCount(1);
			});

			it('should add on-close handler', () => {
				clientUserActivityEvents(client);
				onClose.should.have.been.called;
			});

			it('should remove event listeners when client is closed ', () => {
				clientUserActivityEvents(client);
				onClose.args[0][0]();
				removeEventListener.should.have.been.calledWith('click');
				removeEventListener.should.have.been.calledWith('keydown');
			});
		});

		describe('user activity events with fake-waiting for throttle buffer period', () => {
			var clock;
			var addEventListener;
			var sendEvent;
			var onClose;
			beforeEach(function() {
				var now = Date.now();
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
			it('should add an click event listener which throttles clicks to only send periodically', () => {
				clientUserActivityEvents(client);
				var throttledSendEvent = addEventListener.getCall(0).args[1];

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
			});
		});
	});

});
