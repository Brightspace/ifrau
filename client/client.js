import { clientResizer } from '../plugins/iframe-resizer/client.js';
import { clientSyncCssVariable } from '../plugins/sync-css-variable/client.js';
import { clientSyncDataAttrs } from '../plugins/sync-data-attrs/client.js';
import { clientSyncFlags } from '../plugins/sync-flags/client.js';
import { clientSyncFont } from '../plugins/sync-font/client.js';
import { clientSyncIntl } from '../plugins/sync-intl/client.js';
import { clientSyncLang } from '../plugins/sync-lang/client.js';
import { clientSyncOslo } from '../plugins/sync-oslo/client.js';
import { clientSyncTimezone } from '../plugins/sync-timezone/client.js';
import { clientSyncTitle } from '../plugins/sync-title/client.js';
import { recordUserEvents } from '../plugins/user-activity-events/client.js';
import { SlimClient } from './slim.js';

export class Client extends SlimClient {

	constructor(options) {
		super(options);

		if (options.syncLang !== false) {
			this.use(clientSyncLang);
			this.use(clientSyncIntl);
			this.use(clientSyncTimezone);
			this.use(clientSyncOslo);
		}
		if (options.syncFont) {
			this.use(clientSyncFont);
		}
		if (options.resizeFrame !== false) {
			this.use(clientResizer(options.resizerOptions));
		}
		if (options.syncCssVariable) {
			this.use(clientSyncCssVariable);
		}
		this.use(recordUserEvents);
		this.use(clientSyncTitle(options.syncTitle));
		this.use(clientSyncDataAttrs);
		this.use(clientSyncFlags);
	}

}
