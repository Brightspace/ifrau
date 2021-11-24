import chai, { expect } from 'chai';
import { MockClient, MockHost } from './mocks.js';
import { clientSyncFont } from '../../plugins/sync-font/client.js';
import { hostSyncFont } from '../../plugins/sync-font/host.js';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

chai.use(sinonChai).should();

describe('sync-font', () => {

	const fontFamily = 'comic sans';
	const rootFontSize = '20px';
	const bodyFontSize = '10px';
	let classListAdd;

	beforeEach(() => {
		classListAdd = sinon.spy();
		global.document = {
			documentElement: {
				style: {
					fontSize: rootFontSize
				}
			},
			body: {
				style: {
					fontFamily,
					fontSize: bodyFontSize
				},
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
			getComputedStyle: function(element) {
				return {
					fontFamily: element.style.fontFamily,
					fontSize: element.style.fontSize
				};
			}
		};
	});

	describe('client', () => {

		let client, request, response;

		beforeEach(() => {
			response = {
				family: fontFamily,
				size: bodyFontSize,
				sizeRoot: rootFontSize
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
				expect(document.documentElement.style.fontSize).to.equal(rootFontSize);
				done();
			});
		});

		it('should have the same font size no root', (done) => {
			response.size = '0px';
			response.sizeRoot = undefined;
			clientSyncFont(client).then(() => {
				expect(document.documentElement.style.fontSize).to.equal('0px');
				done();
			});
		});

		it('should have the same font size with root', (done) => {
			response.sizeRoot = '30px';
			clientSyncFont(client).then(() => {
				expect(document.documentElement.style.fontSize).to.equal('30px');
				done();
			});
		});

	});

	describe('host', () => {

		let host, onRequest;

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
				family: fontFamily,
				size: bodyFontSize,
				sizeRoot: rootFontSize,
				visualRedesign: false
			});
		});

		it('should return visual redesign if class is present', () => {
			global.document.body.className = 'visual-redesign';
			hostSyncFont(host);
			const value = onRequest.args[0][1]();
			expect(value).to.eql({
				family: fontFamily,
				size: bodyFontSize,
				sizeRoot: rootFontSize,
				visualRedesign: true
			});
		});

	});

});
