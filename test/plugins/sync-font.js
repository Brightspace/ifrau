'use strict';

const
	expect = require('chai').expect,
	sinon = require('sinon');

require('chai')
	.use(require('sinon-chai'))
	.should();

const
	clientSyncFont = require('../../src/plugins/sync-font/client'),
	hostSyncFont = require('../../src/plugins/sync-font/host');

const MockClient = function() {};
MockClient.prototype.request = function() {};

const MockHost = function() {};
MockHost.prototype.onRequest = function() {};

describe('sync-font', () => {

	var fontFamily = 'comic sans', classListAdd;

	beforeEach(() => {
		classListAdd = sinon.spy();
		global.document = {
			documentElement: {
				style: {
					fontSize: '1pt'
				}
			},
			body: {
				classList: {
					add: classListAdd,
					contains: function(className) {
						return global.document.body.className.indexOf(className) > -1;
					}
				},
				className: ''
			}
		};
		global.window = {
			getComputedStyle: function() {
				return {
					fontFamily: fontFamily,
					fontSize: '20pt'
				};
			}
		};
	});

	describe('client', () => {

		var client, request, response;

		beforeEach(() => {
			response = {
				family: 'foo',
				size: '20px'
			};
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

		it('should request font', () => {
			clientSyncFont(client);
			request.should.have.been.calledWith('font');
		});

		it('should apply font size to HTML element', (done) => {
			clientSyncFont(client).then(() => {
				expect(document.documentElement.style.fontSize).to.equal('20px');
				done();
			});
		});

		it('should have the same font size', (done) => {
			response.size = '13px';
			clientSyncFont(client).then(() => {
				expect(document.documentElement.style.fontSize).to.equal('13px');
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

		it('should return computed font family and size', () => {
			hostSyncFont(host);
			const value = onRequest.args[0][1]();
			expect(value).to.eql({
				family: 'comic sans',
				size: '20pt',
				visualRedesign: false
			});
		});

		it('should return visual redesign if class is present', () => {
			global.document.body.className = 'visual-redesign';
			hostSyncFont(host);
			const value = onRequest.args[0][1]();
			expect(value).to.eql({
				family: 'comic sans',
				size: '20pt',
				visualRedesign: true
			});
		});

	});

});
