'use strict';

const expect = require('chai').expect;

const validateEvent = require('../src/port/validate-event');

describe('validateEvent', () => {
	[
		{endpoint: 'a', source: 'b', expect: false },
		{endpoint: 'a', source: 'a', targetOrigin: 'c', origin: 'd', expect: false },
		{endpoint: 'a', source: 'a', targetOrigin: 'c', origin: 'c', key: undefined, expect: false },
		{endpoint: 'a', source: 'a', targetOrigin: 'c', origin: 'c', key: 'invalid', expect: false },
		{endpoint: 'a', source: 'a', targetOrigin: 'c', origin: 'c', key: 'foo.frau.bar', expect: false },
		{endpoint: 'a', source: 'a', targetOrigin: 'c', origin: 'c', key: 'frau.valid', expect: true },
		{endpoint: 'a', source: 'a', targetOrigin: '*', origin: 'c', key: 'frau.valid', expect: true },
		{endpoint: 'a', source: 'a', targetOrigin: 'c', origin: 'C', key: 'frau.valid', expect: true },
		{endpoint: 'a', source: 'a', targetOrigin: 'C', origin: 'c', key: 'frau.valid', expect: true },
		{endpoint: 'a', source: 'a', targetOrigin: null, origin: null, key: 'frau.valid', expect: false },
		{endpoint: 'a', source: 'a', targetOrigin: undefined, origin: undefined, key: 'frau.valid', expect: false },
		{endpoint: 'a', source: 'a', targetOrigin: 'C', origin: undefined, key: 'frau.valid', expect: false },
		{endpoint: 'a', source: 'a', targetOrigin: '', origin: '', key: 'frau.valid', expect: false }
	].forEach((item, index) => {
		it(`should validate origin "${index}" to "${item.expect}"`, () => {
			var isValid = validateEvent(
				item.targetOrigin,
				item.endpoint,
				{ source: item.source, origin: item.origin, data: { key: item.key } }
			);
			expect(isValid).to.equal(item.expect);
		});
	});
});
