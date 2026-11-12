import config from "@firefoxic/oxlint-config"
import { defineConfig } from "oxlint"

export default defineConfig({
	"extends": [config],
	"env": {
		node: true,
	},
	"rules": {
		"no-underscore-dangle": [
			`error`,
			{
				allow: [
					`_flush`,
					`_transform`,
				],
			},
		],
	},
})
