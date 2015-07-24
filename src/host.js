import Port from './port';
import {default as resizer} from 'iframe-resizer';

var originRe = /^(http:\/\/|https:\/\/)[^\/]+/i;

export default class Host extends Port {
	constructor(elementProvider, src, options) {

		var origin = Host.tryGetOrigin(src);
		if(origin === null) {
			throw new Error(`Unable to extract origin from "${src}"`);
		}

		var parent = elementProvider();
		if (parent === null) {
			throw new Error(`Could not find parent node`);
		}

		var iframe = Host.createIFrame(src);
		parent.appendChild(iframe);

		super(iframe.contentWindow, origin, options);

		this.iframe = iframe;

		this.resizer = null;
	}
	connect() {
		var me = this;
		return new Promise((resolve, reject) => {
			me.onEvent('ready', function() {
				super.connect();
				me.resizer = resizer.iframeResizer({}, me.iframe);
				resolve();
			}).onEvent('title', function(title) {
				document.title = title;
			}).onEvent('navigate', function(url) {
				document.location.href = url;
			});
			super.open();
		});
	}
	close() {
		super.close();
		this.resizer.close(this.iframe);
	}
	static createIFrame(src) {
		var iframe = document.createElement('iframe');
		iframe.width = '100%';
		iframe.style.border = 'none';
		iframe.style.overflow = 'hidden';
		iframe.scrolling = 'no';
		iframe.src = src;
		return iframe;
	}
	static tryGetOrigin(url) {
		var match = originRe.exec(url);
		return (match !== null) ? match[0] : null;
	}
}
