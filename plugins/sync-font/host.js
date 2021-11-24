export function hostSyncFont(host) {
	host.onRequest('font', () => {
		const bodyComputedStyle = window.getComputedStyle(document.body);
		const rootComputedStyle = window.getComputedStyle(document.documentElement);
		const visualRedesign = document.body.classList.contains('visual-redesign');

		return {
			family: bodyComputedStyle.fontFamily,
			size: bodyComputedStyle.fontSize,
			sizeRoot: rootComputedStyle.fontSize,
			visualRedesign: visualRedesign
		};
	});
}
