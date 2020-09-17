const expect = require('chai').expect;

require('chai').use(require('chai-things'));

const
	fromError = require('../src/port/transform-error').fromError,
	toError = require('../src/port/transform-error').toError,
	ERROR_OBJECT_SENTINEL = require('../src/port/transform-error').ERROR_OBJECT_SENTINEL;

describe('transform-error', () => {
	describe('fromError', () => {
		it('should translate an Error into a cloneable object', () => {
			const err = new TypeError('bad things');
			const obj = fromError(err);

			expect(obj).to.be.an('object');
			expect(obj).to.have.a.property('name').that.equals('TypeError');
			expect(obj).to.have.a.property('message').that.equals('bad things');
			expect(obj).to.have.a.property(ERROR_OBJECT_SENTINEL);
		});

		it('should translate an array of Errors into cloneable objects', () => {
			const errs = [new TypeError('bad things'), new Error('other bad things')];
			const objs = fromError(errs);

			expect(objs).to.be.an.instanceof(Array);
			expect(objs).to.have.length(errs.length);
			expect(objs).to.all.have.a.property(ERROR_OBJECT_SENTINEL);
		});

		describe('properties', () => {
			it('should copy properties of the Error/object into a "props" field', () => {
				const err = new Error('bad things');
				err.foo = 'bar';
				err.nul = null;
				err.arr = ['bar'];
				err.obj = { foo: 'bar' };

				const obj = fromError(err);

				expect(obj).to.have.a.property('props').that.is.an('object');
				expect(obj.props).to.have.a.property('foo').that.equals(err.foo);
				expect(obj.props).to.have.a.property('nul').that.equals(err.nul);
				expect(obj.props).to.have.a.property('arr').that.deep.equals(err.arr);
				expect(obj.props).to.have.a.property('obj').that.deep.equals(err.obj);
			});

			it('should copy Function properties as null (sad)', () => {
				const input = {
					fn: () => {}
				};

				const obj = fromError(input);
				expect(obj).to.have.a.property('fn').that.is.null;
			});

			it('should transform Error properties', () => {
				const err = new Error('bad things');
				err.err = new TypeError('other bad things');
				err.err.err = new Error('more bad things');

				const obj = fromError(err);

				expect(obj)
					.to.be.an('object')
					.that.has.a.property(ERROR_OBJECT_SENTINEL);
				expect(obj)
					.to.have.a.property('props')
					.that.is.an('object')
					.that.has.a.property('err')
					.that.is.an('object')
					.that.has.a.property(ERROR_OBJECT_SENTINEL);
				expect(obj.props.err)
					.to.have.a.property('props')
					.that.is.an('object')
					.that.has.a.property('err')
					.that.is.an('object')
					.that.has.a.property(ERROR_OBJECT_SENTINEL);
			});
		});
	});

	describe('toError', () => {
		it('should approximately invert fromError', () => {
			const input = new TypeError('foo');
			input.foo = 'bar';
			input.nul = null;
			input.fn = () => {};
			input.arr = ['bar'];
			input.obj = { foo: 'bar' };
			input.err = new Error('bar');

			const err = toError(fromError(input));

			expect(err).to.be.an.instanceof(Error);
			expect(err).to.have.a.property('name').that.equals('TypeError');
			expect(err).to.have.a.property('message').that.equals('foo');
			expect(err).to.have.a.property('foo').that.equals(input.foo);
			expect(err).to.have.a.property('nul').that.equals(input.nul);
			expect(err).to.have.a.property('fn').that.is.null;
			expect(err).to.have.a.property('arr').that.deep.equals(input.arr);
			expect(err).to.have.a.property('obj').that.deep.equals(input.obj);
			expect(err)
				.to.have.a.property('err')
				.that.is.an.instanceof(Error)
				.and.has.a.property('message')
				.that.equals('bar');
		});
	});
});
