'use strict';

const
	expect = require('chai').expect,
	sinon = require('sinon');

const
	Client = require('../').Client,
	Host = require('../').Host;

describe('ifrau', () => {

	beforeEach(() => {
		global.window = {
			addEventListener: sinon.stub()
		};
		global.document = {
			addEventListener: sinon.stub(),
			createElement: sinon.stub().returns({style: {}, tagName: 'iframe'}),
			getElementById: sinon.stub().returns({
				appendChild: sinon.spy()
			}),
			head: {
				appendChild: sinon.stub()
			}
		};
	});

	it('should export Host', () => {
		var host = new Host(() => document.getElementById('id'), 'http://cdn.com/app/index.html');
		expect(host).to.be.defined;
	});

	it('should export Client', () => {
		var client = new Client({syncTitle: false});
		expect(client).to.be.defined;
	});

});
