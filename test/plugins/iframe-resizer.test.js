import chai from 'chai';
import { hostResizer } from '../../plugins/iframe-resizer/host.js';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

chai.use(sinonChai).should();

class MockHost {
	constructor() {
		this.iframe = {};
	}
	onClose() { }
	onEvent() { }
}

describe('iframe-resizer', () => {

	let host, onEvent, onClose, resizerClose;

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
		hostResizer(host);
		onEvent.should.have.been.calledWith('ready');
	});

	it('should add on-close handler', () => {
		hostResizer(host);
		onClose.should.have.been.called;
	});

	it('should close iframe-resizer on-close', () => {
		hostResizer(host);
		onClose.args[0][0]();
		resizerClose.should.have.been.calledWith(host.iframe);
	});

});
