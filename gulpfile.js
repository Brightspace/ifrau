'use strict';

var opts = {
	targetDirectory: 'ifrau',
	creds: {
		key: 'AKIAIFWDFE37W7LZ52XQ',
		secret: process.env.CDN_SECRET
	},
	version: process.env.TRAVIS_TAG
};

var gulp = require('gulp'),
	pg = require('peanut-gallery'),
	publisher = require('gulp-frau-publisher').lib(opts);

gulp.task( 'publish', function( cb ) {
	gulp.src('./dist/ifrau.js')
		.pipe( publisher.getStream() )
		.on( 'end', function() {
			var message = '[Deployment available online](' +
				publisher.getLocation() + 'ifrau.js)';

			pg.comment( message, {}, function( error, response ) {
				if( error )
					return cb( JSON.stringify( error ) );
				cb();
			} );

		} );
});
