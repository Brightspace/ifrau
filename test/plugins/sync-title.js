'use strict';

const
	expect = require('chai').expect,
	sinon = require('sinon');

require('chai')
	.use(require('sinon-chai'))
	.should();

const
	clientSyncTitle = require('../../src/plugins/sync-title/client'),
	hostSyncTitle = require('../../src/plugins/sync-title/host');

let mutationCallback = null;
const MockMutationObserver = function(cb) {
	mutationCallback = cb;
};
MockMutationObserver.prototype.observe = function() {};

const MockClient = function() {};
MockClient.prototype.sendEvent = function() {};

let onEventCallback = null;
const MockHost = function() {};
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
				clientSyncTitle(true)(client);
				createElement.should.have.been.calledWith('title');
			});

			it('should initially sync page title', () => {
				clientSyncTitle(true)(client);
				sendEvent.should.have.been.calledWith('title', 'init title');
			});

			it('should initially sync page title to iframe title only', () => {
				clientSyncTitle(false)(client);
				sendEvent.should.have.been.calledWith('iframeTitleOnly', 'init title');
			});

			it('should sync with first mutation textContent', () => {
				var mutations = [{target: { textContent: 'new title' } }];
				clientSyncTitle(true)(client);
				mutationCallback(mutations);
				sendEvent.should.have.been.calledWith('title', 'new title');
			});

			it('should only synciframe title with first mutation textContent to iframe title only', () => {
				var mutations = [{target: { textContent: 'new title' } }];
				clientSyncTitle(false)(client);
				mutationCallback(mutations);
				sendEvent.should.have.been.calledWith('iframeTitleOnly', 'new title');
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
				clientSyncTitle(true)(client);
				clock.tick(100);
				sendEvent.should.have.been.calledWith('title', 'init title');
			});

			it('should only sync after 100ms iframe title', () => {
				clientSyncTitle(false)(client);
				clock.tick(100);
				sendEvent.should.have.been.calledWith('iframeTitleOnly', 'init title');
			});

			it('should not sync if title remains the same', () => {
				clientSyncTitle(true)(client);
				clock.tick(200);
				sendEvent.should.have.been.calledOnce;
			});

			it('should sync if title changes', () => {
				clientSyncTitle(true)(client);
				clock.tick(100);
				global.document.title = 'new title';
				clock.tick(100);
				sendEvent.should.have.been.calledWith('title', 'new title');
			});

			it('should only sync iframe title page if title changes', () => {
				clientSyncTitle(false)(client);
				clock.tick(100);
				global.document.title = 'new title';
				clock.tick(100);
				sendEvent.should.have.been.calledWith('iframeTitleOnly', 'new title');
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

		it('should add handler for "title" event and for "iframeTitleOnly" event', () => {
			hostSyncTitle()(host);
			onEvent.should.have.been.calledWith('title');
			onEvent.should.have.been.calledWith('iframeTitleOnly');
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
