import { browserConfig, setDirectoryConfigs, testingConfig } from 'eslint-config-brightspace';
import globals from 'globals';

export default [
	...setDirectoryConfigs(
		browserConfig,
		{
			test: testingConfig
		}
	), {
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
];
