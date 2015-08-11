import {default as iframeResizer} from 'iframe-resizer';

export default function resizer(host) {
	var initialized = false;
	host.onEvent('ready', function() {
		if(initialized) {
			return;
		}
		initialized = true;
		iframeResizer.iframeResizer(
			{
				log: host.debugEnabled
			},
			host.iframe
		);
	});
	host.onClose(function() {
		if(host.iframe && host.iframe.iFrameResizer) {
			host.iframe.iFrameResizer.close(host.iframe);
		}
	});
}
