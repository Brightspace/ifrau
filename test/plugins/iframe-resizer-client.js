'use strict';

require('chai')
	.use(require('sinon-chai'))
	.should();

const resizer = require('../../src/plugins/iframe-resizer/client');

function MockHost() {
	this.iframe = {};
}
MockHost.prototype.onEvent = function() {};
MockHost.prototype.onClose = function() {};

describe('iframe-resizer/client', () => {

	it('should set target origin from client', () => {
		resizer()({
			_targetOrigin: 'somewhere.com'
		});
		window.iFrameResizer.targetOrigin.should.equal('somewhere.com');
	});

	it('should set resizer options', () => {
		resizer({
			heightCalculationMethod: 'bodyOffset'
		})({
			_targetOrigin: 'somewhere.com'
		});
		window.iFrameResizer.targetOrigin.should.equal('somewhere.com');
		window.iFrameResizer.heightCalculationMethod.should.equal('bodyOffset');
	});

});
