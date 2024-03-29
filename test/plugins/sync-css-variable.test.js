import chai, { expect } from 'chai';
import { MockClient, MockHost } from './mocks.js';
import { clientSyncCssVariable } from '../../plugins/sync-css-variable/client.js';
import { hostSyncCssVariable } from '../../plugins/sync-css-variable/host.js';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

chai.use(sinonChai).should();

describe('css-variable', () => {
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

		it('should request for "css-variable"', () => {
			getElementsByTagName
				.withArgs('html')
				.returns([]);
			request
				.withArgs('css-variable')
				.returns(Promise.resolve({}));
			clientSyncCssVariable(client);
			request.should.have.been.calledWith('css-variable');
		});

		it('should apply css variable to HTML element', (done) => {
			const cssVariables = {
				'branding-color': 'green'
			};

			const setProperty = sinon.stub();
			const style = {
				setProperty: setProperty
			};
			getElementsByTagName
				.withArgs('html')
				.returns([{
					style: style
				}]);

			request
				.withArgs('css-variable')
				.returns(Promise.resolve(cssVariables));

			clientSyncCssVariable(client).then(() => {
				setProperty.should.have.been.calledWith(
					'branding-color',
					'green'
				);
				done();
			});
		});

		it('should do nothing if HTML element is not present', (done) => {
			getElementsByTagName
				.withArgs('html')
				.returns([]);
			request
				.withArgs('css-variable')
				.returns(new Promise((resolve) => {
					resolve(true);
				}));

			clientSyncCssVariable(client).then(done);

		});

	});

	describe('host', () => {

		let host, onRequest;

		beforeEach(() => {
			host = new MockHost();
			onRequest = sinon.spy(host, 'onRequest');
		});

		it('should add request handler for "css-variable"', () => {
			hostSyncCssVariable(host);
			onRequest.should.have.been.calledWith('css-variable');
		});

		it('should return parsed value of "data-css-vars" attribute from HTML element', () => {
			const cssVariables = {
				'branding-color': 'green'
			};

			const hasAttribute = sinon.stub();
			hasAttribute
				.withArgs('data-css-vars')
				.returns(true);

			const getAttribute = sinon.stub();
			getAttribute
				.withArgs('data-css-vars')
				.returns(JSON.stringify(cssVariables));

			getElementsByTagName
				.withArgs('html')
				.returns([{
					hasAttribute: hasAttribute,
					getAttribute: getAttribute
				}]);

			hostSyncCssVariable(host);

			const value = onRequest.args[0][1]();
			expect(value).to.eql(cssVariables);
		});

		it('should return empty object if "data-css-vars" attribute not present', () => {
			const hasAttribute = sinon.stub();
			hasAttribute
				.withArgs('data-css-vars')
				.returns(false);

			getElementsByTagName
				.withArgs('html')
				.returns([{
					hasAttribute: hasAttribute
				}]);

			hostSyncCssVariable(host);

			const value = onRequest.args[0][1]();
			expect(value).to.eql({});
		});

		it('should return empty object if HTML element is not present', () => {
			getElementsByTagName
				.withArgs('html')
				.returns([]);
			hostSyncCssVariable(host);
			const value = onRequest.args[0][1]();
			expect(value).to.eql({});
		});

	});

});
