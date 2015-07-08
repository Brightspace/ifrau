import Port from './port';

export default class Client extends Port {
	constructor(options) {

		super(window.parent, '*', options);

		this.lastHeight = 0;

	}
	adjustHeight() {
		var height = document.body.scrollHeight;
		if(height != this.lastHeight) {
			this.lastHeight = height;
			this.sendEventRaw('height', [height]);
		}
	}
	connect() {
		var me = this;
		return new Promise((resolve, reject) => {

			me.open();
			me.sendEventRaw('ready');
			setInterval(me.adjustHeight.bind(me), 100);

			super.connect();
			resolve();

		});
	}
	navigate(url) {
		this.sendEvent('navigate', url);
	}
	setTitle(title) {
		this.sendEvent('title', title);
	}
}
