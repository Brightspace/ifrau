export function hostSyncFont(host) {
	host.onRequest('font', () => {
		const computedStyle = window.getComputedStyle(document.body);
		const visualRedesign = document.body.classList.contains('visual-redesign');
		return {
			family: computedStyle.fontFamily,
			size: computedStyle.fontSize,
			visualRedesign: visualRedesign
		};
	});
}
