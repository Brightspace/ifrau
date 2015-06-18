import Port from './port';

export default class Host extends Port {
	constructor(id, src) {

		var iframe = Host.createIFrame(src);
		var parent = document.getElementById(id);
		parent.appendChild(iframe);

		super(iframe.contentWindow, '*');

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
}
