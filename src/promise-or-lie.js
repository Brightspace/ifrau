'use strict';

module.exports = typeof Promise === 'undefined'
	? require('lie')
	: global.Promise;
