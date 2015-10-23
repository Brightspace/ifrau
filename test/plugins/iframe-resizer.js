var chai = require('chai'),
	expect = chai.expect,
	sinon = require('sinon');

import { host as resizer } from '../../src/plugins/iframe-resizer';

chai.should();
chai.use(require('sinon-chai'));

let MockHost = function() {
	this.iframe = {};
};
MockHost.prototype.onEvent = function() {};
MockHost.prototype.onClose = function() {};

describe('iframe-resizer', () => {

	var host, onEvent, onClose, resizerClose;

	beforeEach(() => {
		resizerClose = sinon.spy();
		host = new MockHost();
		host.iframe.iFrameResizer = {
			close: resizerClose
		};
		onEvent = sinon.stub(host, 'onEvent');
		onClose = sinon.stub(host, 'onClose');
	});

	afterEach(() => {
		onEvent.restore();
		onClose.restore();
	});

	it('should add handler for "ready" event', () => {
		resizer(host);
		onEvent.should.have.been.calledWith('ready');
	});

	it('should add on-close handler', () => {
		resizer(host);
		onClose.should.have.been.called;
	});

	it('should close iframe-resizer on-close', () => {
		resizer(host);
		onClose.args[0][0]();
		resizerClose.should.have.been.calledWith(host.iframe);
	});

});
