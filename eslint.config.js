import { fileURLToPath } from 'node:url';
import { FlatCompat } from '@eslint/eslintrc';
import globals from 'globals';
import js from '@eslint/js';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
	baseDirectory: __dirname,
	recommendedConfig: js.configs.recommended,
	allConfig: js.configs.all
});
export default [...compat.extends('brightspace/browser-config'), {
	languageOptions: {
		globals: {
			...globals.node,
		},
	},

	rules: {
		'no-empty': ['error', {
			allowEmptyCatch: true,
		}],
	},
},
...compat.extends('brightspace/testing-config').map(c => ({
	...c,
	files: ['test/**/*']
}))
];
