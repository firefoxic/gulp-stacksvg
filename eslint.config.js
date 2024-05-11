import { default as firefoxicEslintConfig, globals } from "@firefoxic/eslint-config"

export default [
	{
		languageOptions: {
			globals: {
				...globals.nodeBuiltin,
			},
		},
	},
	...firefoxicEslintConfig,
]
