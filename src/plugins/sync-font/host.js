'use strict';

module.exports = function hostSyncFont(host) {
	host.onRequest('font', function() {
		var computedStyle = window.getComputedStyle(document.body);
		var dyslexic = document.body.classList.contains('vui-dyslexic')
			|| computedStyle.fontFamily.toLowerCase().indexOf('dyslexic') > -1;
		var visualRedesign = document.body.classList.contains('visual-redesign');
		return {
			dyslexic: dyslexic,
			family: computedStyle.fontFamily,
			size: computedStyle.fontSize,
			visualRedesign: visualRedesign
		};
	});
};
