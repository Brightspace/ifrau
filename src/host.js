import Port from './port';

var originRe = /^(http:\/\/|https:\/\/)[^\/]+/i;

export default class Host extends Port {
	constructor(id, src) {

		var origin = Host.tryGetOrigin(src);
		if(origin === null) {
			throw new Error(`Unable to extract origin from "${src}"`);
		}

		var parent = document.getElementById(id);
		if(parent === null) {
			throw new Error(`Could not find parent node with id "${id}"`);
		}

		var iframe = Host.createIFrame(src);
		parent.appendChild(iframe);

		super(iframe.contentWindow, origin);

		this.iframe = iframe;

	}
	connect() {
		var me = this;
		return new Promise((resolve, reject) => {
			me.onEvent('ready', function() {
				me.sendEventRaw('csrf', {
					origin: window.location.origin,
					token: localStorage['XSRF.Token']
				});
				super.connect();
				resolve();
			}).onEvent('height', function(height) {
				me.iframe.style.height = height + 'px';
			}).onEvent('title', function(title) {
				document.title = title;
			}).onEvent('navigate', function(url) {
				document.location.href = url;
			});
			super.open();
		});
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
