module.exports = function clientSyncFlags(client) {
	return client.request('flags').then(function(flags) {
		window.D2L = window.D2L || {};
		window.D2L.LP = window.D2L.LP || {};
		window.D2L.LP.Web = window.D2L.LP.Web || {};
		window.D2L.LP.Web.UI = window.D2L.LP.Web.UI || {};
		window.D2L.LP.Web.UI.Flags = window.D2L.LP.Web.UI.Flags || {
			ListedFlags: flags || {},
			Flag: function(feature, defaultValue) {
				const featureValue = window.D2L.LP.Web.UI.Flags.ListedFlags[feature];

				return featureValue !== undefined ? featureValue : defaultValue;
			}
		};
	});
};
