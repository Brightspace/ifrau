import chai, { expect } from 'chai';
import { clientSyncTitle } from '../../plugins/sync-title/client.js';
import { hostSyncTitle } from '../../plugins/sync-title/host.js';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

chai.use(sinonChai).should();

class MockClient {
	constructor() { }
	sendEvent() { }
}

let mutationCallback = null;
class MockMutationObserver {
	constructor(cb) {
		mutationCallback = cb;
	}
	observe() { }
}

let onEventCallback = null;
class MockHost {
	constructor() { }
	onEvent(evt, cb) {
		onEventCallback = cb;
	}
}

describe('sync-title', () => {

	beforeEach(() => {
		global.document = {
			title: 'init title'
		};
	});

	describe('client', () => {

		let client, sendEvent;

		beforeEach(() => {
			global.window = {};
			client = new MockClient();
			sendEvent = sinon.stub(client, 'sendEvent');
		});

		afterEach(() => {
			sendEvent.restore();
		});

		describe('mutation-observer', () => {

			let createElement;

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

			it('should initially sync page title only for iframe title', () => {
				clientSyncTitle(false)(client);
				sendEvent.should.have.been.calledWith('title', 'init title', true);
			});

			it('should sync with first mutation textContent', () => {
				const mutations = [{ target: { textContent: 'new title' } }];
				clientSyncTitle(true)(client);
				mutationCallback(mutations);
				sendEvent.should.have.been.calledWith('title', 'new title');
			});

			it('should sync with first mutation textContent only for iframe title', () => {
				const mutations = [{ target: { textContent: 'new title' } }];
				clientSyncTitle(false)(client);
				mutationCallback(mutations);
				sendEvent.should.have.been.calledWith('title', 'new title', true);
			});

		});

		describe('polling-observer', () => {

			let clock;

			beforeEach(() => {
				clock = sinon.useFakeTimers();
			});

			afterEach(() => {
				clock.restore();
			});

			it('should sync after 100ms', () => {
				clientSyncTitle(true)(client);
				clock.tick(100);
				sendEvent.should.have.been.calledWith('title', 'init title', false);
			});

			it('should only sync iframe title after 100ms', () => {
				clientSyncTitle(false)(client);
				clock.tick(100);
				sendEvent.should.have.been.calledWith('title', 'init title', true);
			});

			it('should sync page title if no value is provided', () => {
				clientSyncTitle()(client);
				clock.tick(100);
				sendEvent.should.have.been.calledWith('title', 'init title', false);
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
				sendEvent.should.have.been.calledWith('title', 'new title', false);
			});

			it('should only sync iframeTitle if title changes', () => {
				clientSyncTitle(false)(client);
				clock.tick(100);
				global.document.title = 'new title';
				clock.tick(100);
				sendEvent.should.have.been.calledWith('title', 'new title', true);
			});

		});

	});

	describe('host', () => {

		let host, onEvent;

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
			hostSyncTitle({ page: true })(host);
			onEventCallback('new title');
			expect(global.document.title).to.equal('new title');
		});

		it('should not set page title when option is off', () => {
			hostSyncTitle({ page: false })(host);
			onEventCallback('new title');
			expect(global.document.title).to.equal('init title');
		});

		it('should not set iframe title if undefined', () => {
			hostSyncTitle()(host);
			onEventCallback('new title');
			expect(host.iframe).to.be.undefined;
		});

		it('should set iframe title if defined', () => {
			host.iframe = {};
			hostSyncTitle()(host);
			onEventCallback('new title');
			expect(host.iframe.title).to.equal('new title');
		});

		it('should only set iframe title if defined', () => {
			host.iframe = {};
			hostSyncTitle()(host);
			onEventCallback('new title', true);
			expect(global.document.title).to.not.equal('new title');
			expect(host.iframe.title).to.equal('new title');
		});

	});

});
