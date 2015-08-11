var chai = require('chai'),
	expect = chai.expect,
	sinon = require('sinon');

chai.should();
chai.use(require('sinon-chai'));

import { clientSyncTitle, hostSyncTitle } from '../../src/plugins/sync-title';

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

describe('sync-title', () => {

	beforeEach(() => {
		global.document = {
			title: 'init title'
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

			var createElement;

			beforeEach(() => {
				createElement = sinon.spy();
				global.window.MutationObserver = MockMutationObserver;
				global.document.createElement = createElement;
				global.document.getElementsByTagName = sinon.stub().returns([
					{
						appendChild: sinon.stub()
					}
				]);
				global.document.querySelector = sinon.stub().returns({});
				mutationCallback = null;
			});

			it('should create a title element if it is missing', () => {
				global.document.querySelector.returns(null);
				clientSyncTitle(client);
				createElement.should.have.been.calledWith('title');
			});

			it('should initially sync page title', () => {
				clientSyncTitle(client);
				sendEvent.should.have.been.calledWith('title', 'init title');
			});

			it('should sync with first mutation textContent', () => {
				var mutations = [{target: { textContent: 'new title' } }];
				clientSyncTitle(client);
				mutationCallback(mutations);
				sendEvent.should.have.been.calledWith('title', 'new title');
			});

		});

		describe('polling-observer', () => {

			var clock;

			beforeEach(() => {
				clock = sinon.useFakeTimers();
			});

			afterEach(() => {
				clock.restore();
			});

			it('should sync after 100ms', () => {
				clientSyncTitle(client);
				clock.tick(100);
				sendEvent.should.have.been.calledWith('title', 'init title');
			});

			it('should not sync if title remains the same', () => {
				clientSyncTitle(client);
				clock.tick(200);
				sendEvent.should.have.been.calledOnce;
			});

			it('should sync if title changes', () => {
				clientSyncTitle(client);
				clock.tick(100);
				global.document.title = 'new title';
				clock.tick(100);
				sendEvent.should.have.been.calledWith('title', 'new title');
			});

		});

	});

	describe('host', () => {

		var host, onEvent;

		beforeEach(() => {
			host = new MockHost();
			onEvent = sinon.spy(host, 'onEvent');
			onEventCallback = null;
		});

		afterEach(() => {
			onEvent.restore();
		});

		it('should add handler for "title" event', () => {
			hostSyncTitle()(host);
			onEvent.should.have.been.calledWith('title');
		});

		it('should set page title when event fires', () => {
			hostSyncTitle({page: true})(host);
			onEventCallback('new title');
			expect(global.document.title).to.equal('new title');
		});

		it('should not set page title when option is off', () => {
			hostSyncTitle({page: false})(host);
			onEventCallback('new title');
			expect(global.document.title).to.equal('init title');
		});

		it('should not set iframe title if undefined', () => {
			hostSyncTitle()(host);
			onEventCallback('new title');
			expect(host.iframe).to.not.be.defined;
		});

		it('should set iframe title if defined', () => {
			host.iframe = {};
			hostSyncTitle()(host);
			onEventCallback('new title');
			expect(host.iframe.title).to.equal('new title');
		});

	});

});
