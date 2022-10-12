import { hostResizer } from './plugins/iframe-resizer/host.js';
import { hostSyncCssVariable } from './plugins/sync-css-variable/host.js';
import { hostSyncDataAttrs } from './plugins/sync-data-attrs/host.js';
import { hostSyncFlags } from './plugins/sync-flags/host.js';
import { hostSyncFont } from './plugins/sync-font/host.js';
import { hostSyncIntl } from './plugins/sync-intl/host.js';
import { hostSyncLang } from './plugins/sync-lang/host.js';
import { hostSyncOslo } from './plugins/sync-oslo/host.js';
import { hostSyncTimezone } from './plugins/sync-timezone/host.js';
import { hostSyncTitle } from './plugins/sync-title/host.js';
import { PortWithServices } from './port/services.js';

const createIFrame = (src, frameId, height, allowFullScreen, allowMicrophone, allowCamera, allowScreenCapture, allowEncryptedMedia, allowAutoplay) => {
	const iframe = document.createElement('iframe');
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
		const allow = [];
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

const originRe = /^(http:\/\/|https:\/\/)[^/]+/i;

const tryGetOrigin = (url) => {
	if (url && url.indexOf('//') === 0) {
		url = window.location.protocol + url;
	} else if (url && url.indexOf('/d2l/') === 0) {
		return window.location.origin;
	}

	const match = originRe.exec(url);
	return (match !== null) ? match[0] : null;
};

export class Host extends PortWithServices {

	constructor(elementProvider, src, options) {
		const origin = tryGetOrigin(src);
		if (origin === null) throw new Error(`Unable to extract origin from ${src}`);

		const parent = elementProvider();
		if (parent === null) throw new Error('Could not find parent node');

		options = options || {};

		const iframe = createIFrame(
			src,
			options.id,
			options.height,
			options.allowFullScreen,
			options.allowMicrophone,
			options.allowCamera,
			options.allowScreenCapture,
			options.allowEncryptedMedia,
			options.allowAutoplay
		);
		parent.appendChild(iframe);

		super(iframe.contentWindow, origin, options);
		this.iframe = iframe;

		if (options.syncLang) {
			this.use(hostSyncLang);
			this.use(hostSyncIntl);
			this.use(hostSyncTimezone);
			this.use(hostSyncOslo);
		}
		this.use(hostSyncTitle({ page: options.syncPageTitle ? true : false }));

		if (!(options.height || options.height === 0) && options.resizeFrame !== false) {
			this.use(hostResizer);
		}

		if (options.syncFont) {
			this.use(hostSyncFont);
		}
		if (options.syncCssVariable) {
			this.use(hostSyncCssVariable);
		}
		this.use(hostSyncDataAttrs);
		this.use(hostSyncFlags);
	}

	async connect() {
		return new Promise(resolve => {
			this.onEvent('ready', async() => {
				if (this._isConnected) {
					return;
				}

				await super.connect();
				resolve(this);
			});
			this.open();
		});
	}

}
