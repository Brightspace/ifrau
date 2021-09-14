import chai, { expect } from 'chai';
import { MockClient, MockHost } from './mocks.js';
import { clientSyncFlags } from '../../plugins/sync-flags/client.js';
import { hostSyncFlags } from '../../plugins/sync-flags/host.js';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

chai.use(sinonChai).should();

describe('sync-flags', () => {

	const flagName = 'test';
	const flags = { [flagName]: true };

	describe('host', () => {

		let host, onRequest;

		beforeEach(() => {
			global.window = {
				D2L: {
					LP: {
						Web: {
							UI: {
								Flags: {
									ListedFlags: flags
								}
							}
						}
					}
				}
			};
			host = new MockHost();
			onRequest = sinon.spy(host, 'onRequest');
		});

		afterEach(() => {
			onRequest.restore();
		});

		it('should add request handler for "flags"', () => {
			hostSyncFlags(host);
			onRequest.should.have.been.calledWith('flags');
		});

		it('should return flags', () => {
			hostSyncFlags(host);
			const value = onRequest.args[0][1]();
			expect(value).to.eql(flags);
		});

		it('should return empty flags', () => {
			global.window = {};
			hostSyncFlags(host);
			const value = onRequest.args[0][1]();
			expect(value).to.eql({});
		});

	});

	describe('client', () => {

		let client, request, response;

		beforeEach(() => {
			response = flags;
			client = new MockClient();
			request = sinon.stub(client, 'request').returns(
				new Promise((resolve) => {
					resolve(response);
				})
			);
		});

		afterEach(() => {
			request.restore();
		});

		it('should request flags', () => {
			clientSyncFlags(client);
			request.should.have.been.calledWith('flags');
		});

		it('should setup flags', (done) => {
			clientSyncFlags(client).then(() => {
				expect(window.D2L.LP.Web.UI.Flags.ListedFlags).to.equal(flags);
				expect(window.D2L.LP.Web.UI.Flags.Flag(flagName, false)).to.be.true;
				expect(window.D2L.LP.Web.UI.Flags.Flag('invalid', 0)).to.eql(0);
				done();
			});
		});

	});

});
