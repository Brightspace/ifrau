let count = 0;

export function getUniqueId() {
	count++;
	return `d2l-iframe-uid-${count}`;
}
