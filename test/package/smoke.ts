import Vinyl from "vinyl"
import { describe, expect, test } from "vitest"

import { stacksvg } from "../../src/index.ts"

/**
 * This suite proves the plugin works end to end against the TypeScript source
 * directly, with no build step: type stripping runs the `.ts` files as-is.
 */
describe(`package`, () => {
	test(`Package should export the plugin factory`, () => {
		expect(typeof stacksvg).toBe(`function`)
	})

	test(`Package should build a sprite end to end`, async () => {
		let stream = stacksvg()

		let files = await new Promise<Vinyl[]>((resolve) => {
			let collected: Vinyl[] = []

			stream.on(`data`, (file: Vinyl) => { collected.push(file) })
			stream.on(`end`, () => { resolve(collected) })

			stream.write(new Vinyl({
				path: `circle.svg`,
				contents: Buffer.from(`<svg viewBox="0 0 4 4"><circle cx="2" cy="2" r="1"/></svg>`),
			}))
			stream.end()
		})

		expect(files).toHaveLength(1)
		expect(files[0].relative).toBe(`stack.svg`)
		expect(contentsOf(files[0])).toBe(`<svg xmlns="http://www.w3.org/2000/svg"><style>:root svg:not(:target){display:none}</style><svg viewBox="0 0 4 4" id="circle"><circle cx="2" cy="2" r="1"/></svg></svg>`)
	})
})

function contentsOf (file: Vinyl): string {
	if (!file.isBuffer()) throw new Error(`expected a buffer file`)

	return file.contents.toString()
}
