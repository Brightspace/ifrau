'use strict';

const
	expect = require('chai').expect,
	sinon = require('sinon');

require('chai')
	.use(require('sinon-chai'))
	.should();

const
	clientUserActivityEvents = require('../../src/plugins/user-activity-events/client');

let mutationCallback = null;
let MockMutationObserver = function(cb) {
	mutationCallback = cb;
};
MockMutationObserver.prototype.observe = function() {};

let MockClient = function() {};
MockClient.prototype.sendEvent = function() {};

let onEventCallback = null;
let MockHost = function() {};
MockHost.prototype.onEvent = function(evt, cb) {
	onEventCallback = cb;
};

describe('user-activity-events', () => {

	beforeEach(() => {
		global.document = { 
		};
	});

	describe('client', () => {

		var client, sendEvent;

		beforeEach(() => {
			global.window = {};
			client = new MockClient();
			sendEvent = sinon.stub(client, 'sendEvent');
		});

		afterEach(() => {
			sendEvent.restore();
		});

		describe('mutation-observer', () => {

			var addEventListener;

			beforeEach(() => {
				addEventListener = sinon.spy();
				global.window.MutationObserver = MockMutationObserver;
				global.document.addEventListener = addEventListener;
			});

			it('should add an click event listener', () => {
				clientUserActivityEvents(client);
				addEventListener.should.have.been.calledWith('click');
			});

			it('should add an keydown event listener', () => {
				clientUserActivityEvents(client);
				addEventListener.should.have.been.calledWith('keydown');
			});

		});

	});

});
