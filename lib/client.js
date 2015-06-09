import Port from './port';

export default class Client extends Port {
	constructor(cb) {

		super(window.parent, '*');

		this.lastHeight = 0;
		var hasCsrfToken = false;
		var me = this;
		this.on('csrf', function(data) {
				localStorage['XSRF.Token@' + data.origin] = data.token;
				if(!hasCsrfToken) {
					hasCsrfToken = true;
					cb(me);
				}
			}).open()
			.sendEvent('ready');

		setInterval(this.adjustHeight.bind(this), 100);

	}
	adjustHeight() {
		var height = document.body.scrollHeight;
		if(height != this.lastHeight) {
			this.lastHeight = height;
			this.sendEvent('height', height);
		}
	}
	navigate(url) {
		this.sendEvent('navigate', url);
	}
	setTitle(title) {
		this.sendEvent('title', title);
	}
}
