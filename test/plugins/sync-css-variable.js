'use strict';

const
	expect = require('chai').expect,
	sinon = require('sinon');

require('chai')
	.use(require('sinon-chai'))
	.should();

const
	clientSyncCssVariable = require('../../src/plugins/sync-css-variable/client'),
	hostSyncCssVariable = require('../../src/plugins/sync-css-variable/host');

const MockClient = function() {};
MockClient.prototype.request = function() {};

const MockHost = function() {};
MockHost.prototype.onRequest = function() {};

describe('css-variable', () => {
	let getElementsByTagName;
	let getElementById;

	beforeEach(() => {
		getElementsByTagName = sinon.stub();
		getElementById = sinon.stub();
		global.document = {
			getElementsByTagName: getElementsByTagName,
			getElementById: getElementById
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

		var host, onRequest;

		beforeEach(() => {
			host = new MockHost();
			onRequest = sinon.spy(host, 'onRequest');
		});

		it('should add request handler for "css-variable"', () => {
			hostSyncCssVariable(host);
			onRequest.should.have.been.calledWith('css-variable');
		});

		it('should return empty object if "d2l-branding-vars" id not present', () => {
			getElementById
				.withArgs('d2l-branding-vars')
				.returns(null);

			hostSyncCssVariable(host);

			const value = onRequest.args[0][1]();
			expect(value).to.eql({});
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

			getElementById
				.withArgs('d2l-branding-vars')
				.returns({
					hasAttribute: hasAttribute,
					getAttribute: getAttribute
				});

			hostSyncCssVariable(host);

			const value = onRequest.args[0][1]();
			expect(value).to.eql(cssVariables);
		});

		it('should return empty object if "data-css-vars" attribute not present', () => {
			const hasAttribute = sinon.stub();
			hasAttribute
				.withArgs('data-css-vars')
				.returns(false);

			getElementById
				.withArgs('d2l-branding-vars')
				.returns({
					hasAttribute: hasAttribute
				});

			hostSyncCssVariable(host);

			const value = onRequest.args[0][1]();
			expect(value).to.eql({});
		});

	});

});
