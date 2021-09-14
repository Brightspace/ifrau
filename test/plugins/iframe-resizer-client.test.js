import chai from 'chai';
import { clientResizer } from '../../plugins/iframe-resizer/client.js';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

chai.use(sinonChai).should();

describe('iframe-resizer/client', () => {

	beforeEach(() => {
		global.window = {};
		global.document = {
			createElement: sinon.stub().returns({}),
			head: {
				appendChild: sinon.stub()
			}
		};
	});

	it('should set target origin from client', () => {
		clientResizer()({
			_targetOrigin: 'somewhere.com'
		});
		window.iFrameResizer.targetOrigin.should.equal('somewhere.com');
	});

	it('should set resizer options', () => {
		clientResizer({
			heightCalculationMethod: 'bodyOffset'
		})({
			_targetOrigin: 'somewhere.com'
		});
		window.iFrameResizer.targetOrigin.should.equal('somewhere.com');
		window.iFrameResizer.heightCalculationMethod.should.equal('bodyOffset');
	});

});
