export const ERROR_OBJECT_SENTINEL = '_ifrau-error-object';

function deErrorifyArray(input) {
	const result = input.map(fromError);
	return result;
}

function errorifyArray(input) {
	const result = input.map(toError);
	return result;
}

function deErrorifyObject(input) {
	const isError = input instanceof Error;
	const result = isError ? { props: {} } : {};

	if (isError) {
		result.message = input.message;
		result.name = input.name;

		result[ERROR_OBJECT_SENTINEL] = true;
	}

	const propTarget = isError ? result.props : result;

	Object.keys(input).forEach((key) => {
		const prop = fromError(input[key]);
		propTarget[key] = prop;
	});

	return result;
}

function errorifyObject(input) {
	const isError = input[ERROR_OBJECT_SENTINEL] === true;
	const result = isError ? new Error(input.message) : {};

	if (isError) result.name = input.name;

	const propSource = isError ? input.props : input;
	Object.keys(propSource).forEach((key) => {
		const prop = toError(propSource[key]);
		result[key] = prop;
	});

	return result;
}

export function fromError(input) {
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

export function toError(input) {
	if (input !== null && typeof input === 'object') {
		if (Array.isArray(input)) {
			return errorifyArray(input);
		}

		return errorifyObject(input);
	}

	return input;
}
