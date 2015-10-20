import Port from './port';
import {default as resizer} from './plugins/iframe-resizer';
import {hostSyncFont} from './plugins/sync-font';
import {hostSyncLang} from './plugins/sync-lang';
import {hostSyncTitle} from './plugins/sync-title';

var originRe = /^(http:\/\/|https:\/\/)[^\/]+/i;

export default class Host extends Port {
	constructor(elementProvider, src, options) {

		options = options || {};

		var origin = Host.tryGetOrigin(src);
		if(origin === null) {
			throw new Error(`Unable to extract origin from "${src}"`);
		}

		var parent = elementProvider();
		if (parent === null) {
			throw new Error(`Could not find parent node`);
		}

		var iframe = Host.createIFrame(src, options.id, options.height);
		parent.appendChild(iframe);

		super(iframe.contentWindow, origin, options);

		this.iframe = iframe;

		if(options.syncLang) {
			this.use(hostSyncLang);
		}
		this.use(hostSyncTitle({page: options.syncPageTitle ? true : false}));

		if(!(options.height || options.height === 0) && options.resizeFrame !== false) {
			this.use(resizer);
		}

		if(options.syncFont) {
			this.use(hostSyncFont);
		}

	}
	connect() {
		var me = this;
		return new Promise((resolve, reject) => {
			me.onEvent('ready', function() {
				super.connect();
				resolve(me);
			});
			super.open();
		});
	}
	static createIFrame(src, frameId, height) {
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
	}
	static tryGetOrigin(url) {
		if(url && url.indexOf('//') === 0) {
			url = window.location.protocol + url;
		}
		var match = originRe.exec(url);
		return (match !== null) ? match[0] : null;
	}
}
