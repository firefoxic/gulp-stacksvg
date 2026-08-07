import { readFile } from "node:fs/promises"

import Vinyl from "vinyl"
import { describe, expect, test } from "vitest"

import { stacksvg } from "../../dist/index.js"

/**
 * The unit suite covers the behaviour against the source. This suite only proves
 * that the published artifact is wired up correctly: it is importable through the
 * package exports, it still works end to end after bundling and minification, and
 * it ships the type declarations promised by `exports.types`.
 */
describe(`published package`, () => {
	test(`Package should export the plugin factory`, () => {
		expect(typeof stacksvg).toBe(`function`)
	})

	test(`Package should build a sprite end to end`, async () => {
		let stream = stacksvg()

		let files = await new Promise((resolve) => {
			let collected = []

			stream.on(`data`, (file) => { collected.push(file) })
			stream.on(`end`, () => { resolve(collected) })

			stream.write(new Vinyl({
				path: `circle.svg`,
				contents: Buffer.from(`<svg viewBox="0 0 4 4"><circle cx="2" cy="2" r="1"/></svg>`),
			}))
			stream.end()
		})

		expect(files).toHaveLength(1)
		expect(files[0].relative).toBe(`stack.svg`)
		expect(files[0].contents.toString()).toBe(`<svg xmlns="http://www.w3.org/2000/svg"><style>:root svg:not(:target){display:none}</style><svg viewBox="0 0 4 4" id="circle"><circle cx="2" cy="2" r="1"></circle></svg></svg>`)
	})

	test(`Package should ship the type declarations`, async () => {
		let declarations = await readFile(new URL(`../../dist/index.d.ts`, import.meta.url), `utf8`)

		expect(declarations).toContain(`stacksvg`)
	})
})
