const
	expect = require('chai').expect,
	sinon = require('sinon');

require('chai')
	.use(require('sinon-chai'))
	.should();

const
	clientSyncOslo = require('../../src/plugins/sync-oslo/client'),
	hostSyncOslo = require('../../src/plugins/sync-oslo/host');

const MockClient = function() {};
MockClient.prototype.request = function() {};

const MockHost = function() {};
MockHost.prototype.onRequest = function() {};

describe('sync-oslo', () => {
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

		it('should request for "oslo"', () => {
			getElementsByTagName
				.withArgs('html')
				.returns([]);
			request
				.withArgs('oslo')
				.returns(Promise.resolve({}));
			clientSyncOslo(client);
			request.should.have.been.calledWith('oslo');
		});

		it('should apply oslo JSON to HTML element', (done) => {

			const osloData = {
				batch: 'batch',
				collection: 'collection',
				version: 'version'
			};

			const setAttribute = sinon.stub();
			getElementsByTagName
				.withArgs('html')
				.returns([{
					setAttribute: setAttribute
				}]);

			request
				.withArgs('oslo')
				.returns(Promise.resolve(osloData));

			clientSyncOslo(client).then(() => {
				setAttribute.should.have.been.calledWith(
					'data-oslo',
					JSON.stringify(osloData)
				);
				done();
			});
		});

		it('should do nothing if HTML element is not present', (done) => {

			getElementsByTagName
				.withArgs('html')
				.returns([]);

			request
				.withArgs('oslo')
				.returns(new Promise((resolve) => {
					resolve(true);
				}));

			clientSyncOslo(client).then(done);
		});
	});

	describe('host', () => {
		var host, onRequest;

		beforeEach(() => {
			host = new MockHost();
			onRequest = sinon.spy(host, 'onRequest');
		});

		it('should add request handler for "oslo"', () => {
			hostSyncOslo(host);
			onRequest.should.have.been.calledWith('oslo');
		});

		it('should return parsed value of "data-oslo" attribute from HTML element', () => {

			const osloData = {
				batch: 'batch',
				collection: 'collection',
				version: 'version'
			};

			const hasAttribute = sinon.stub();
			hasAttribute
				.withArgs('data-oslo')
				.returns(true);

			const getAttribute = sinon.stub();
			getAttribute
				.withArgs('data-oslo')
				.returns(JSON.stringify(osloData));

			getElementsByTagName
				.withArgs('html')
				.returns([{
					getAttribute: getAttribute,
					hasAttribute: hasAttribute
				}]);

			hostSyncOslo(host);

			const value = onRequest.args[0][1]();
			expect(value).to.eql({
				batch: 'https://dummy/batch',
				collection: 'https://dummy/collection',
				version: 'version'
			});
		});

		it('should return empty object if "data-oslo" attribute not present', () => {

			const hasAttribute = sinon.stub();
			hasAttribute
				.withArgs('data-oslo')
				.returns(false);

			getElementsByTagName
				.withArgs('html')
				.returns([{
					hasAttribute: hasAttribute
				}]);

			hostSyncOslo(host);

			const value = onRequest.args[0][1]();
			expect(value).to.be.undefined;
		});
	});
});
