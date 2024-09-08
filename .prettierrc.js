import sharedConfig from '@kitschpatrol/prettier-config'

/** @type {import("prettier").Config} */
const localConfig = {
	// Config overrides
	overrides: [
		...sharedConfig.overrides,
		{
			files: ['error-matcher.json', 'entrypoint.sh'],
			options: {
				useTabs: false,
				tabWidth: 4,
			},
		},
		{
			files: ['*.md'],
			options: {
				singleQuote: false,
			},
		},
	],
}
export default {
	...sharedConfig,
	...localConfig,
}
