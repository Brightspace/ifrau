export const ERROR_OBJECT_SENTINEL = '_ifrau-error-object';

function deErrorifyArray (input) {
	const result = input.map(deErrorify);
	return result;
}

function errorifyArray (input) {
	const result = input.map(errorify);
	return result;
}

function deErrorifyObject (input) {
	const isError = input instanceof Error;
	const result = isError ? { props: {} } : {};

	if (isError) {
		result.message = input.message;
		result.name = input.name;

		result[ERROR_OBJECT_SENTINEL] = true;
	}

	const propTarget = isError ? result.props : result;
	for (let key of Object.keys(input)) {
		const prop = deErrorify(input[key]);

		propTarget[key] = prop;
	}

	return result;
}

function errorifyObject (input) {
	const isError = input[ERROR_OBJECT_SENTINEL] === true;

	const result = isError ? new Error(input.message) : {};

	if (isError) {
		result.name = input.name;
	}

	const propSource = isError ? input.props : input;
	for (let key of Object.keys(propSource)) {
		const prop = errorify(propSource[key]);

		result[key] = prop;
	}

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

export { deErrorify as fromError };
export { errorify as toError };
