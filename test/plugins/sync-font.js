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

let MockClient = function() {};
MockClient.prototype.request = function() {};

let MockHost = function() {};
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
				dyslexic: false,
				family: 'foo',
				size: '20px',
				visualRedesign: false
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

		[
			{source: '11px', expected: '18px'},
			{source: '13px', expected: '20px'},
			{source: '17px', expected: '22px'},
			{source: '26px', expected: '24px'},
			{source: '1px', expected: '20px'},
			{source: 'foo', expected: '20px'}
		].forEach((val) => {
			it(`should convert ${val.source} to ${val.expected}`, (done) => {
				response.size = val.source;
				clientSyncFont(client).then(() => {
					expect(document.documentElement.style.fontSize).to.equal(val.expected);
					done();
				});
			});
		});

		it('should not convert font sizes if flag is on', (done) => {
			response.visualRedesign = true;
			response.size = '13px';
			clientSyncFont(client).then(() => {
				expect(document.documentElement.style.fontSize).to.equal('13px');
				done();
			});
		});

		it('should not add dyslexic class', (done) => {
			clientSyncFont(client).then(() => {
				classListAdd.should.have.not.been.called;
				done();
			});
		});

		it('should add dyslexic class', (done) => {
			response.dyslexic = true;
			clientSyncFont(client).then(() => {
				classListAdd.should.have.been.calledWith('d2l-dyslexic');
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
				dyslexic: false,
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
				dyslexic: false,
				family: 'comic sans',
				size: '20pt',
				visualRedesign: true
			});
		});

		it('should return dyslexic if class is present', () => {
			global.document.body.className = 'd2l-dyslexic';
			hostSyncFont(host);
			const value = onRequest.args[0][1]();
			expect(value).to.eql({
				dyslexic: true,
				family: 'comic sans',
				size: '20pt',
				visualRedesign: false
			});
		});

		it('should return dyslexic if font matches', () => {
			fontFamily = 'Open Dyslexic';
			hostSyncFont(host);
			const value = onRequest.args[0][1]();
			expect(value).to.eql({
				dyslexic: true,
				family: 'Open Dyslexic',
				size: '20pt',
				visualRedesign: false
			});
		});

	});

});
