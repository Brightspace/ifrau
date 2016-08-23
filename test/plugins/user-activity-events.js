'use strict';

const
	sinon = require('sinon');

require('chai')
	.use(require('sinon-chai'))
	.should();

const
	clientUserActivityEvents = require('../../src/plugins/user-activity-events/client');

let MockClient = function() {};

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

		describe('mutation-observer', () => {

			var addEventListener;

			beforeEach(() => {
				addEventListener = sinon.spy();
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
