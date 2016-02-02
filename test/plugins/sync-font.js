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
				className: '',
				style: {
					fontFamily: 'verdana',
					fontSize: '12px'
				}
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
				size: 'bar',
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

		it('should apply result to body when redesign flag is off', (done) => {
			clientSyncFont(client).then(() => {
				expect(document.body.style.fontFamily).to.equal('foo');
				expect(document.body.style.fontSize).to.equal('bar');
				expect(document.documentElement.style.fontSize).to.equal('1pt');
				done();
			});
		});

		it('should apply only font size to HTML element when redesign flag is on', (done) => {
			response.visualRedesign = true;
			clientSyncFont(client).then(() => {
				expect(document.body.style.fontFamily).to.equal('verdana');
				expect(document.body.style.fontSize).to.equal('12px');
				expect(document.documentElement.style.fontSize).to.equal('bar');
				done();
			});
		});

		it('should ignore dyslexic when flag is off', (done) => {
			response.dyslexic = true;
			clientSyncFont(client).then(() => {
				classListAdd.should.have.not.been.called;
				done();
			});
		});

		it('should add dyslexic class when flag is on', (done) => {
			response.visualRedesign = true;
			response.dyslexic = true;
			clientSyncFont(client).then(() => {
				classListAdd.should.have.been.calledWith('vui-dyslexic');
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
			global.document.body.className = 'vui-dyslexic';
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
