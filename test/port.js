var expect = require('chai').expect,
	sinon = require('sinon');

import Port from '../src/port';

describe('port', () => {

	var port;

	beforeEach(() => {
		global.window = {
			addEventListener: sinon.stub(),
			removeEventListener: sinon.stub()
		};
		port = new Port();
	});

	it('should listen for "message" events when "open" is called', ()=> {
		port.open();
		expect(global.window.addEventListener.calledWith('message'))
			.to.be.true;
	});

	it('should stop listening for "message" events when "close" is called', () => {
		port.close();
		expect(
				global.window.removeEventListener.calledWith(
					'message',
					port.receiveMessage
				)
			).to.be.true;
	});

});
