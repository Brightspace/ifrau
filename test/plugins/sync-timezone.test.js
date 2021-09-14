import chai, { expect } from 'chai';
import { MockClient, MockHost } from './mocks.js';
import { clientSyncTimezone } from '../../plugins/sync-timezone/client.js';
import { hostSyncTimezone } from '../../plugins/sync-timezone/host.js';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

chai.use(sinonChai).should();

describe('sync-timezone', () => {

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

		it('should request for "timezone"', () => {
			getElementsByTagName
				.withArgs('html')
				.returns([]);
			request
				.withArgs('timezone')
				.returns(Promise.resolve({}));
			clientSyncTimezone(client);
			request.should.have.been.calledWith('timezone');
		});

		it('should apply timezone JSON to HTML element', (done) => {

			const timezoneData = {
				identifier: 'Timbuktu/Mali',
				name: 'Timbuktu Standard Time'
			};

			const setAttribute = sinon.stub();
			getElementsByTagName
				.withArgs('html')
				.returns([{
					setAttribute: setAttribute
				}]);

			request
				.withArgs('timezone')
				.returns(Promise.resolve(timezoneData));

			clientSyncTimezone(client).then(() => {
				setAttribute.should.have.been.calledWith(
					'data-timezone',
					JSON.stringify(timezoneData)
				);
				done();
			});

		});

		it('should do nothing if HTML element is not present', (done) => {

			getElementsByTagName
				.withArgs('html')
				.returns([]);

			request
				.withArgs('timezone')
				.returns(new Promise((resolve) => {
					resolve(true);
				}));

			clientSyncTimezone(client).then(done);

		});

	});

	describe('host', () => {

		let host, onRequest;

		beforeEach(() => {
			host = new MockHost();
			onRequest = sinon.spy(host, 'onRequest');
		});

		it('should add request handler for "timezone"', () => {
			hostSyncTimezone(host);
			onRequest.should.have.been.calledWith('timezone');
		});

		it('should return parsed value of "data-timezone" attribute from HTML element', () => {

			const timezoneData = {
				identifier: 'Timbuktu/Mali',
				name: 'Timbuktu Standard Time'
			};

			const hasAttribute = sinon.stub();
			hasAttribute
				.withArgs('data-timezone')
				.returns(true);

			const getAttribute = sinon.stub();
			getAttribute
				.withArgs('data-timezone')
				.returns(JSON.stringify(timezoneData));

			getElementsByTagName
				.withArgs('html')
				.returns([{
					getAttribute: getAttribute,
					hasAttribute: hasAttribute
				}]);

			hostSyncTimezone(host);

			const value = onRequest.args[0][1]();
			expect(value).to.eql(timezoneData);

		});

		it('should return empty object if "data-timezone" attribute not present', () => {

			const hasAttribute = sinon.stub();
			hasAttribute
				.withArgs('data-timezone')
				.returns(false);

			getElementsByTagName
				.withArgs('html')
				.returns([{
					hasAttribute: hasAttribute
				}]);

			hostSyncTimezone(host);

			const value = onRequest.args[0][1]();
			expect(value).to.eql({ identifier: '', name: '' });

		});

	});

});
