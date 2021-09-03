import { PortWithServices } from '../port/services.js';

export class SlimClient extends PortWithServices {

	constructor(options) {
		super(window.parent, '*', options);
	}

	async connect() {
		this.open();
		this._sendMessage('evt', 'ready');
		await super.connect();
		return this;
	}

}
