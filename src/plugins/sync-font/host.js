module.exports = function hostSyncFont(host) {
	host.onRequest('font', function() {
		var computedStyle = window.getComputedStyle(document.body);
		var visualRedesign = document.body.classList.contains('visual-redesign');
		return {
			family: computedStyle.fontFamily,
			size: computedStyle.fontSize,
			visualRedesign: visualRedesign
		};
	});
};
