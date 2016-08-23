/* eslint-disable no-invalid-this */
'use strict';

const
	sinon = require('sinon');

require('chai')
	.use(require('sinon-chai'))
	.should();

const
	clientUserActivityEvents = require('../../src/plugins/user-activity-events/client');

let sendEvent = function() {};
let MockClient = function() {
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
			var addEventListener;
			var sendEvent;
			beforeEach(() => {
				addEventListener = sinon.spy();
				sendEvent = sinon.spy();
				global.document.addEventListener = addEventListener;
				client.sendEvent = sendEvent;
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

		});

		describe('user activity events with waiting for throttle buffer period', () => {
			var addEventListener;
			var sendEvent;
			beforeEach(function(done) {
				this.timeout(12000);
				addEventListener = sinon.spy();
				sendEvent = sinon.spy();
				global.document.addEventListener = addEventListener;
				client.sendEvent = sendEvent;
				clientUserActivityEvents(client);
				//call the actual event handler function three times and then wait for 10 seconds, for the throttle buffer
				addEventListener.getCall(0).args[1].apply();
				addEventListener.getCall(0).args[1].apply();
				addEventListener.getCall(0).args[1].apply();
				sendEvent.should.have.callCount(1);
				setTimeout(function() {
					// complete the async beforeEach
					done();
				}, 10000);

			});

			it('should add an click event listener which throttles clicks to only send periodically', () => {
				sendEvent.should.have.callCount(2);
			});

		});
	});

});
