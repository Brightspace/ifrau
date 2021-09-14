function isStringEmpty(str) {
	return (!str || 0 === str.length);
}

export function validateEvent(targetOrigin, endpoint, e) {
	const isValid = (e.source === endpoint)
		&& (
			targetOrigin === '*'
			|| !isStringEmpty(targetOrigin)
			&& !isStringEmpty(e.origin)
			&& targetOrigin.toUpperCase() === e.origin.toUpperCase()
		)
		&& (e.data.key !== undefined)
		&& (e.data.key !== null)
		&& (e.data.key.indexOf('frau.') === 0);
	return isValid;
}
