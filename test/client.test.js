import chai, { expect } from 'chai';
import { Client } from '../client/client.js';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

chai.use(sinonChai).should();

describe('client', () => {

	let client, sendEvent, sendMessage, use, clock;

	beforeEach(() => {
		global.window = {
			addEventListener: sinon.stub(),
			parent: {
				postMessage: sinon.stub()
			}
		};
		global.document = {
			addEventListener: sinon.stub(),
			body: {
				scrollHeight: 100
			},
			createElement: sinon.stub().returns({ src:'' }),
			head: {
				appendChild: sinon.stub()
			}
		};

		// sync-title runs sendEvent when it initializes before we can stub it out,.
		// so prevent any plugins from being loaded at all.
		use = sinon.stub(Client.prototype, 'use');

		client = new Client({ syncLang: false, syncTitle: false });
		sendEvent = sinon.stub(client, 'sendEvent');
		sendMessage = sinon.stub(client, '_sendMessage');
		clock = sinon.useFakeTimers();
	});

	afterEach(() => {
		sendEvent.restore();
		sendMessage.restore();
		use.restore();
		clock.restore();
	});

	describe('connect', () => {

		let open;

		beforeEach(() => {
			open = sinon.stub(client, 'open');
		});

		afterEach(() => {
			open.restore();
		});

		it('should return a promise', () => {
			const p = client.connect();
			expect(p).to.not.be.undefined;
			expect(p.then).to.not.be.undefined;
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
			sendMessage.should.have.been.calledWith('evt', 'ready');
		});

	});

});
