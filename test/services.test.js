import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { PortWithServices } from '../port/services.js';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

chai.use(sinonChai).should();
chai.use(chaiAsPromised);

const targetOrigin = 'http://cdn.com/app/index.html';

describe('services', () => {

	let port, endpoint;

	beforeEach(async() => {
		global.window = {
			D2L: {
				UniqueIFrameId: {}
			},
			addEventListener: sinon.stub(),
			removeEventListener: sinon.stub()
		};
		endpoint = {
			postMessage: sinon.stub()
		};
		port = new PortWithServices(endpoint, targetOrigin);
		port._pluginStartupValues = [];
	});

	describe('getService', () => {

		let request;

		beforeEach(() => {
			request = sinon.stub(port, 'request');
			request.withArgs('service:foo:1.0').returns(
				new Promise((resolve/*, reject*/) => {
					setTimeout(() => {
						resolve(['a', 'b']);
					});
				})
			);
			request.withArgs('service:foo:1.0:a', '1', true).returns(5);
		});

		afterEach(() => {
			request.restore();
		});

		it('should throw if not connected', () => {
			expect(port.getService('foo', '1.0')).to.be.rejectedWith('Cannot getService() before connect() has completed');
		});

		it('should return a promise', () => {
			port.connect();
			const promise = port.getService('foo', '1.0');
			expect(promise).to.not.be.undefined;
			expect(promise.then).to.not.be.undefined;
		});

		it('should create a proxy with each method exposed', (done) => {
			port.connect();
			port.getService('foo', '1.0')
				.then((foo) => {
					request.should.have.been.calledWith('service:foo:1.0');
					expect(foo).to.not.be.undefined;
					expect(foo.a).to.not.be.undefined;
					expect(foo.b).to.not.be.undefined;
					done();
				});
		});

		it('should send requests for method calls, passing arguments', (done) => {
			port.connect();
			port.getService('foo', '1.0')
				.then((foo) => {
					const result = foo.a('1', true);
					request.should.have.been.calledWith('service:foo:1.0:a', '1', true);
					expect(result).to.eql(5);
					done();
				});
		});

	});

	describe('registerService', () => {

		let onRequest;

		beforeEach(() => {
			onRequest = sinon.stub(port, 'onRequest');
		});

		afterEach(() => {
			onRequest.restore();
		});

		it('should throw if register happens after connect', () => {
			expect(() => {
				port.connect();
				port.registerService('foo', '1.0', {});
			}).to.throw(Error, 'Register services before connecting');
		});

		['123', 'a1', 'a.b', 'a:b', '-ab'].forEach((name) => {
			it(`should throw for invalid service name: ${name}`, () => {
				expect(() => {
					port.registerService(name, '1.0', {});
				}).to.throw(Error, 'Invalid service type');
			});
		});

		['a', 'A', 'ab', 'aB', 'a-b'].forEach((name) => {
			it(`should allow valid service name: ${name}`, () => {
				port.registerService(name, '1.0', {});
				onRequest.should.have.been.calledWith(`service:${name}:1.0`);
			});
		});

		it('should add a single onRequest handler for the service definition', () => {
			port.registerService('fooService', '1.0', {
				a: function() {},
				b: function() {},
				c: 5
			});
			onRequest.should.have.been.calledWith(
				'service:fooService:1.0',
				['a', 'b']
			);
		});

		it('should add an onRequest handler for each service method', () => {
			const a = function() {};
			const b = function() {};
			port.registerService('fooService', '1.0', {
				a: a, b: b, c: 5
			});
			onRequest.should.have.been.calledWith(
				'service:fooService:1.0:a',
				a
			);
			onRequest.should.have.been.calledWith(
				'service:fooService:1.0:b',
				b
			);
		});

		it('should not add onRequest handler for non-function members', () => {
			port.registerService('fooService', '1.0', { a: 5 });
			onRequest.should.not.have.been.calledWith(
				'service:fooService:1.0:a',
				5
			);
		});

	});
});
