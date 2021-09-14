import chai, { expect } from 'chai';
import { MockClient, MockHost } from './mocks.js';
import { clientSyncDataAttrs } from '../../plugins/sync-data-attrs/client.js';
import { hostSyncDataAttrs } from '../../plugins/sync-data-attrs/host.js';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

chai.use(sinonChai).should();

describe('sync-data-attrs', () => {
	let getElementsByTagName;

	beforeEach(() => {
		getElementsByTagName = sinon.stub();
		global.document = {
			getElementsByTagName: getElementsByTagName
		};
		global.window = {
			location: { protocol: 'https:', origin: 'https://dummy' },
			URL: class {
				constructor(path, base) {
					this._href = `${base}/${path}`;
				}
				get href() {
					return this._href;
				}
			}
		};
	});

	describe('client', () => {
		let client, request;

		beforeEach(() => {
			client = new MockClient();
			request = sinon.stub(client, 'request');
		});

		it('should request for "attrs"', () => {
			getElementsByTagName
				.withArgs('html')
				.returns([]);
			request
				.withArgs('attrs')
				.returns(Promise.resolve({}));
			clientSyncDataAttrs(client);
			request.should.have.been.calledWith('attrs');
		});

		it('should apply data attributes to HTML element', (done) => {

			const dataAttrs = {
				testAttr: 'someValue',
				anotherTestAttr: 'someOtherValue'
			};

			const dataset = {};
			getElementsByTagName
				.withArgs('html')
				.returns([{
					dataset: dataset
				}]);

			request
				.withArgs('attrs')
				.returns(Promise.resolve(dataAttrs));

			clientSyncDataAttrs(client).then(() => {
				expect(dataset).to.deep.equal(dataAttrs);
				done();
			});
		});

		it('should not apply excluded data attributes to HTML element', (done) => {

			const dataAttrs = {
				testAttr: 'someValue',
				timezone: 'someTimezone'
			};

			const dataset = {};
			getElementsByTagName
				.withArgs('html')
				.returns([{
					dataset: dataset
				}]);

			request
				.withArgs('attrs')
				.returns(Promise.resolve(dataAttrs));

			clientSyncDataAttrs(client).then(() => {
				expect(dataset).to.have.key('testAttr');
				expect(dataset).to.not.have.key('timezone');
				done();
			});
		});

		it('should do nothing if HTML element is not present', (done) => {

			getElementsByTagName
				.withArgs('html')
				.returns([]);

			request
				.withArgs('attrs')
				.returns(new Promise((resolve) => {
					resolve(true);
				}));

			clientSyncDataAttrs(client).then(done);
		});
	});

	describe('host', () => {
		let host, onRequest;

		beforeEach(() => {
			host = new MockHost();
			onRequest = sinon.spy(host, 'onRequest');
		});

		it('should add request handler for "attrs"', () => {
			hostSyncDataAttrs(host);
			onRequest.should.have.been.calledWith('attrs');
		});

		it('should return all data attributes from HTML element', () => {

			const dataAttrs = {
				testAttr: 'someValue',
				anotherTestAttr: 'someOtherValue',
				timezone: 'someTimezone'
			};

			const hasAttributes = sinon.stub();
			hasAttributes.returns(true);

			getElementsByTagName
				.withArgs('html')
				.returns([{
					dataset: dataAttrs,
					hasAttributes: hasAttributes
				}]);

			hostSyncDataAttrs(host);

			const value = onRequest.args[0][1]();
			expect(value).to.deep.eql(dataAttrs);
		});

		it('should return empty object if no attributes are present', () => {

			const hasAttributes = sinon.stub();
			hasAttributes.returns(false);

			getElementsByTagName
				.withArgs('html')
				.returns([{
					hasAttributes: hasAttributes
				}]);

			hostSyncDataAttrs(host);

			const value = onRequest.args[0][1]();
			expect(value).to.be.empty;
		});
	});
});
