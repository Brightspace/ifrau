window.D2L = window.D2L || {};
window.D2L.UniqueIFrameId = window.D2L.UniqueIFrameId || {};

export function getUniqueId() {
	if (window.D2L.UniqueIFrameId._unique_index === undefined) {
		window.D2L.UniqueIFrameId._unique_index = 0;
	}
	window.D2L.UniqueIFrameId._unique_index++;
	return `d2l-iframe-uid-${window.D2L.UniqueIFrameId._unique_index}`;
}
