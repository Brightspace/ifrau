'use strict';

const
	expect = require('chai').expect,
	sinon = require('sinon');

require('chai')
	.use(require('sinon-chai'))
	.should();

const
	clientSyncIntl = require('../../src/plugins/sync-intl/client'),
	hostSyncIntl = require('../../src/plugins/sync-intl/host');

const MockClient = function() {};
MockClient.prototype.request = function() {};

const MockHost = function() {};
MockHost.prototype.onRequest = function() {};

describe('sync-intl', () => {

	let getElementsByTagName;

	beforeEach(() => {
		getElementsByTagName = sinon.stub();
		global.document = {
			getElementsByTagName: getElementsByTagName
		};
	});

	describe('client', () => {

		let client, request;

		beforeEach(() => {
			client = new MockClient();
			request = sinon.stub(client, 'request');
		});

		it('should request for "intl"', () => {
			getElementsByTagName
				.withArgs('html')
				.returns([]);
			request
				.withArgs('intl')
				.returns(Promise.resolve({}));
			clientSyncIntl(client);
			request.should.have.been.calledWith('intl');
		});

		it('should apply intl JSON to HTML element', (done) => {

			const intlData = {foo: 'bar', bar: 5};

			const setAttribute = sinon.stub();
			getElementsByTagName
				.withArgs('html')
				.returns([{
					setAttribute: setAttribute
				}]);

			request
				.withArgs('intl')
				.returns(Promise.resolve(intlData));

			clientSyncIntl(client).then(() => {
				setAttribute.should.have.been.calledWith(
					'data-intl-overrides',
					JSON.stringify(intlData)
				);
				done();
			});

		});

		it('should do nothing if HTML element is not present', (done) => {

			getElementsByTagName
				.withArgs('html')
				.returns([]);

			request
				.withArgs('intl')
				.returns(new Promise((resolve) => {
					resolve(true);
				}));

			clientSyncIntl(client).then(done);

		});

	});

	describe('host', () => {

		var host, onRequest;

		beforeEach(() => {
			host = new MockHost();
			onRequest = sinon.spy(host, 'onRequest');
		});

		it('should add request handler for "intl"', () => {
			hostSyncIntl(host);
			onRequest.should.have.been.calledWith('intl');
		});

		it('should return parsed value of "data-intl-overrides" attribute from HTML element', () => {

			const intlData = {foo: 'bar', bar: 5};

			const hasAttribute = sinon.stub();
			hasAttribute
				.withArgs('data-intl-overrides')
				.returns(true);

			const getAttribute = sinon.stub();
			getAttribute
				.withArgs('data-intl-overrides')
				.returns(JSON.stringify(intlData));

			getElementsByTagName
				.withArgs('html')
				.returns([{
					getAttribute: getAttribute,
					hasAttribute: hasAttribute
				}]);

			hostSyncIntl(host);

			const value = onRequest.args[0][1]();
			expect(value).to.eql(intlData);

		});

		it('should return empty object if "data-intl-overrides" attribute not present', () => {

			const hasAttribute = sinon.stub();
			hasAttribute
				.withArgs('data-intl-overrides')
				.returns(false);

			getElementsByTagName
				.withArgs('html')
				.returns([{
					hasAttribute: hasAttribute
				}]);

			hostSyncIntl(host);

			const value = onRequest.args[0][1]();
			expect(value).to.eql({});

		});

	});

});
