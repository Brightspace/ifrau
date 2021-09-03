export function hostSyncFlags(host) {
	host.onRequest('flags', () => {
		if (!window.D2L || !window.D2L.LP || !window.D2L.LP.Web ||
			!window.D2L.LP.Web.UI || !window.D2L.LP.Web.UI.Flags) {
			return {};
		}

		return window.D2L.LP.Web.UI.Flags.ListedFlags;
	});
}
