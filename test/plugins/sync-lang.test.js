import chai, { expect } from 'chai';
import { MockClient, MockHost } from './mocks.js';
import { clientSyncLang } from '../../plugins/sync-lang/client.js';
import { hostSyncLang } from '../../plugins/sync-lang/host.js';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

chai.use(sinonChai).should();

describe('sync-lang', () => {

	let setAttribute, getAttribute;

	beforeEach(() => {
		setAttribute = sinon.stub();
		getAttribute = sinon.stub();
		global.document = {
			dir: '',
			getElementsByTagName: function() {
				return [{
					getAttribute: getAttribute,
					setAttribute: setAttribute
				}];
			}
		};
	});

	describe('client', () => {

		let client, request;

		beforeEach(() => {
			client = new MockClient();
			request = sinon.stub(client, 'request');
		});

		afterEach(() => {
			request.restore();
		});

		it('should request for "lang"', () => {
			request.returns(new Promise(() => {}));
			clientSyncLang(client);
			request.should.have.been.calledWith('lang');
		});

		it('should apply langTag to HTML element', (done) => {
			request.returns(new Promise((resolve) => {
				resolve({ lang: 'ab-CD' });
			}));
			clientSyncLang(client).then(() => {
				setAttribute.should.have.been.calledWith('lang', 'ab-CD');
				done();
			});
		});

		it('should apply fallback to HTML element', (done) => {
			request.returns(new Promise((resolve) => {
				resolve({ fallback: 'ef-GH' });
			}));
			clientSyncLang(client).then(() => {
				setAttribute.should.have.been.calledWith('data-lang-default', 'ef-GH');
				done();
			});
		});

		it('should set RTL direction on html', (done) => {
			request.returns(new Promise((resolve) => {
				resolve({ isRtl: true });
			}));
			clientSyncLang(client).then(() => {
				setAttribute.should.have.been.calledWith('dir', 'rtl');
				expect(document.dir).to.equal('rtl');
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

		it('should add request handler for "lang"', () => {
			hostSyncLang(host);
			onRequest.should.have.been.calledWith('lang');
		});

		it('should return lang attribute from HTML element', () => {
			getAttribute.withArgs('lang').returns('ab-CD');
			hostSyncLang(host);
			const value = onRequest.args[0][1]();
			expect(value.lang).to.equal('ab-CD');
		});

		it('should return data-lang-default attribute from HTML element', () => {
			getAttribute.withArgs('data-lang-default').returns('ef-GH');
			hostSyncLang(host);
			const value = onRequest.args[0][1]();
			expect(value.fallback).to.equal('ef-GH');
		});

		it('should be RTL html direction is RTL', () => {
			global.document.dir = 'RtL';
			hostSyncLang(host);
			const value = onRequest.args[0][1]();
			expect(value.isRtl).to.be.true;
		});

		it('should not be RTL html direction is not RTL', () => {
			global.document.dir = 'abc';
			hostSyncLang(host);
			const value = onRequest.args[0][1]();
			expect(value.isRtl).to.be.false;
		});

	});

});
