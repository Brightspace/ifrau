var inherits = require('inherits');

var Port = require('./port'),
	resizer = require('./plugins/iframe-resizer/host'),
	syncDataAttrs = require('./plugins/sync-data-attrs/host'),
	syncFont = require('./plugins/sync-font/host'),
	syncLang = require('./plugins/sync-lang/host'),
	syncIntl = require('./plugins/sync-intl/host'),
	syncTimezone = require('./plugins/sync-timezone/host'),
	syncTitle = require('./plugins/sync-title/host'),
	syncCssVariable = require('./plugins/sync-css-variable/host'),
	syncOslo = require('./plugins/sync-oslo/host'),
	syncFlags = require('./plugins/sync-flags/host');

var originRe = /^(http:\/\/|https:\/\/)[^/]+/i;

function Host(elementProvider, src, options) {
	if (!(this instanceof Host)) {
		return new Host(elementProvider, src, options);
	}

	options = options || {};

	var origin = Host._tryGetOrigin(src);
	if (origin === null) {
		throw new Error('Unable to extract origin from "' + src + '"');
	}

	var parent = elementProvider();
	if (parent === null) {
		throw new Error('Could not find parent node');
	}

	var iframe = Host._createIFrame(src, options.id, options.height, options.allowFullScreen, options.allowMicrophone, options.allowCamera, options.allowScreenCapture, options.allowEncryptedMedia, options.allowAutoplay);
	parent.appendChild(iframe);

	Port.call(this, iframe.contentWindow, origin, options);

	this.iframe = iframe;

	if (options.syncLang) {
		this.use(syncLang);
		this.use(syncIntl);
		this.use(syncTimezone);
		this.use(syncOslo);
	}
	this.use(syncTitle({ page: options.syncPageTitle ? true : false }));

	if (!(options.height || options.height === 0) && options.resizeFrame !== false) {
		this.use(resizer);
	}

	if (options.syncFont) {
		this.use(syncFont);
	}
	if (options.syncCssVariable) {
		this.use(syncCssVariable);
	}
	this.use(syncDataAttrs);
	this.use(syncFlags);
}
inherits(Host, Port);

Host.prototype.connect = function connect() {
	var me = this;
	return new Promise(function(resolve/*, reject*/) {
		me.onEvent('ready', function() {
			if (me._isConnected) {
				return;
			}

			resolve(Port.prototype.connect.call(me));
		});
		me.open();
	});
};

Host._createIFrame = function createIFrame(src, frameId, height, allowFullScreen, allowMicrophone, allowCamera, allowScreenCapture, allowEncryptedMedia, allowAutoplay) {
	var iframe = document.createElement('iframe');
	iframe.width = '100%';
	if (height || height === 0) {
		iframe.style.height = height;
	}
	iframe.style.border = 'none';
	iframe.style.overflow = 'hidden';
	iframe.scrolling = 'no';
	iframe.src = src;
	if (frameId) {
		iframe.id = frameId;
	}
	if (allowMicrophone || allowCamera || allowScreenCapture || allowEncryptedMedia || allowAutoplay) {
		var allow = [];
		if (allowCamera) {
			allow.push('camera *;');
		}
		if (allowMicrophone) {
			allow.push('microphone *;');
		}
		if (allowScreenCapture) {
			allow.push('display-capture *;');
		}
		if (allowEncryptedMedia) {
			allow.push('encrypted-media *;');
		}
		if (allowAutoplay) {
			allow.push('autoplay *;');
		}
		iframe.setAttribute('allow', allow.join(' '));
	}
	if (allowFullScreen) {
		iframe.setAttribute('allowfullscreen', 'allowfullscreen');
	}

	return iframe;
};

Host._tryGetOrigin = function tryGetOrigin(url) {
	if (url && url.indexOf('//') === 0) {
		url = window.location.protocol + url;
	}
	var match = originRe.exec(url);
	return (match !== null) ? match[0] : null;
};

module.exports = Host;
