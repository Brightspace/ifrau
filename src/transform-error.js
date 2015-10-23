var ERROR_OBJECT_SENTINEL = '_ifrau-error-object';

function deErrorifyArray (input) {
	var result = input.map(deErrorify);
	return result;
}

function errorifyArray (input) {
	var result = input.map(errorify);
	return result;
}

function deErrorifyObject (input) {
	var isError = input instanceof Error;
	var result = isError ? { props: {} } : {};

	if (isError) {
		result.message = input.message;
		result.name = input.name;

		result[ERROR_OBJECT_SENTINEL] = true;
	}

	var propTarget = isError ? result.props : result;

	Object.keys(input).forEach(function(key) {
		var prop = deErrorify(input[key]);

		propTarget[key] = prop;
	});

	return result;
}

function errorifyObject (input) {
	var isError = input[ERROR_OBJECT_SENTINEL] === true;

	var result = isError ? new Error(input.message) : {};

	if (isError) {
		result.name = input.name;
	}

	var propSource = isError ? input.props : input;
	Object.keys(propSource).forEach(function(key) {
		var prop = errorify(propSource[key]);

		result[key] = prop;
	});

	return result;
}

function deErrorify (input) {
	if (input !== null && typeof input === 'object') {
		if (Array.isArray(input)) {
			return deErrorifyArray(input);
		}

		return deErrorifyObject(input);
	}

	if (typeof input === 'function') {
		// Not much to be done here :(
		return null;
	}

	return input;
}

function errorify (input) {
	if (input !== null && typeof input === 'object') {
		if (Array.isArray(input)) {
			return errorifyArray(input);
		}

		return errorifyObject(input);
	}

	return input;
}

module.exports.ERROR_OBJECT_SENTINEL = ERROR_OBJECT_SENTINEL;
module.exports.fromError = deErrorify;
module.exports.toError = errorify;
