import { defineConfig } from "vitest/config"

export default defineConfig({
	test: {
		projects: [
			{
				test: {
					name: `unit`,
					include: [`test/unit/**/*.js`],
				},
			},
			{
				test: {
					name: `package`,
					include: [`test/package/**/*.js`],
				},
			},
		],
		coverage: {
			include: [`src/**`],
			reporter: [`text`, `html`],
		},
	},
})
