function isStringEmpty(str) {
	return (!str || 0 === str.length);
}

function validateEvent(targetOrigin, endpoint, e) {
	var isValid = (e.source === endpoint)
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

module.exports = validateEvent;
