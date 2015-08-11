import Port from './port';
import {clientSyncTitle} from './plugins/sync-title';

export default class Client extends Port {
	constructor(options) {

		options = options || {};

		super(window.parent, '*', options);

		if(options.syncTitle !== false) {
			this.use(clientSyncTitle);
		}

	}
	connect() {
		var me = this;
		return new Promise((resolve, reject) => {

			me.open();
			me.sendMessage('evt.ready');

			super.connect();
			resolve();

		});
	}
	navigate(url) {
		this.sendEvent('navigate', url);
	}
}
