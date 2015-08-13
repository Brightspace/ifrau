var chai = require('chai'),
	expect = chai.expect,
	sinon = require('sinon');

chai.should();
chai.use(require('sinon-chai'));

import { clientSyncFont, hostSyncFont } from '../../src/plugins/sync-font';

let MockClient = function() {};
MockClient.prototype.request = function() {};

let MockHost = function() {};
MockHost.prototype.onRequest = function() {};

describe('sync-font', () => {

	beforeEach(() => {
		global.document = {
			body: {
				style: {
					fontFamily: 'verdana',
					fontSize: '12px'
				}
			}
		};
		global.window = {
			getComputedStyle: function() {
				return {
					fontFamily: 'comic sans',
					fontSize: '20pt'
				};
			}
		};
	});

	describe('client', () => {

		var client, request;

		beforeEach(() => {
			client = new MockClient();
			request = sinon.stub(client, 'request').returns(
				new Promise((resolve) => {
					resolve({family: 'foo', size: 'bar'});
				})
			);
		});

		afterEach(() => {
			request.restore();
		});

		it('should request font', () => {
			clientSyncFont(client);
			request.should.have.been.calledWith('font');
		});

		it('should apply result to body', (done) => {
			clientSyncFont(client).then(() => {
				expect(document.body.style.fontFamily).to.equal('foo');
				expect(document.body.style.fontSize).to.equal('bar');
				done();
			});
		});

	});

	describe('host', () => {

		var host, onRequest;

		beforeEach(() => {
			host = new MockHost();
			onRequest = sinon.spy(host, 'onRequest');
		});

		afterEach(() => {
			onRequest.restore();
		});

		it('should add request handler for "font"', () => {
			hostSyncFont(host);
			onRequest.should.have.been.calledWith('font');
		});

		it('should return computed style', () => {
			hostSyncFont(host);
			const value = onRequest.args[0][1]();
			expect(value).to.eql({family: 'comic sans', size: '20pt'});
		});

	});

});
