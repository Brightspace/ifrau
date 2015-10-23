'use strict';

var inherits = require('inherits'),
	Promise = require('lie');

var Port = require('./port'),
	resizer = require('./plugins/iframe-resizer').host,
	syncFont = require('./plugins/sync-font').host,
	syncLang = require('./plugins/sync-lang').host,
	syncTitle = require('./plugins/sync-title').host;

var originRe = /^(http:\/\/|https:\/\/)[^\/]+/i;


function Host(elementProvider, src, options) {
	if (!(this instanceof Host)) {
		return new Host(elementProvider, src, options);
	}

	options = options || {};

	var origin = Host._tryGetOrigin(src);
	if(origin === null) {
		throw new Error('Unable to extract origin from "' + src + '"');
	}

	var parent = elementProvider();
	if (parent === null) {
		throw new Error('Could not find parent node');
	}

	var iframe = Host._createIFrame(src, options.id, options.height);
	parent.appendChild(iframe);

	Port.call(this, iframe.contentWindow, origin, options);

	this.iframe = iframe;

	if(options.syncLang) {
		this.use(syncLang);
	}
	this.use(syncTitle({page: options.syncPageTitle ? true : false}));

	if(!(options.height || options.height === 0) && options.resizeFrame !== false) {
		this.use(resizer);
	}

	if(options.syncFont) {
		this.use(syncFont);
	}

}
inherits(Host, Port);

Host.prototype.connect = function connect() {
	var me = this;
	return new Promise(function(resolve/*, reject*/) {
		me.onEvent('ready', function() {
			Port.prototype.connect.call(me);
			resolve(me);
		});
		me.open();
	});
};

Host._createIFrame = function createIFrame(src, frameId, height) {
	var iframe = document.createElement('iframe');
	iframe.width = '100%';
	if(height || height === 0) {
		iframe.height = height;
	}
	iframe.style.border = 'none';
	iframe.style.overflow = 'hidden';
	iframe.scrolling = 'no';
	iframe.src = src;
	if(frameId) {
		iframe.id = frameId;
	}
	return iframe;
};

Host._tryGetOrigin = function tryGetOrigin(url) {
	if(url && url.indexOf('//') === 0) {
		url = window.location.protocol + url;
	}
	var match = originRe.exec(url);
	return (match !== null) ? match[0] : null;
};

module.exports = Host;
