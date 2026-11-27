import { Readable, Transform } from "node:stream"

import PluginError from "plugin-error"
import Vinyl from "vinyl"
import { describe, expect, test } from "vitest"

import { stacksvg } from "../../src/index.js"

function collect (stream: Transform): Promise<{ files: Vinyl[], error: Error | null }> {
	return new Promise((resolve) => {
		let files: Vinyl[] = []
		let error: Error | null = null

		stream.on(`data`, (file: Vinyl) => { files.push(file) })
		stream.on(`error`, (err: Error) => {
			error = err
			resolve({ files, error })
		})
		stream.on(`end`, () => { resolve({ files, error }) })

		stream.end()
	})
}

function contentsOf (file: Vinyl): string {
	if (!file.isBuffer()) throw new Error(`expected a buffer file`)

	return file.contents.toString()
}

function errorMessageOf (error: Error | null): string {
	if (!error) throw new Error(`expected an error`)

	return error.message
}

describe(`gulp-stacksvg`, () => {
	test(`Plugin should not create empty svg file`, async () => {
		let stream = stacksvg()
		let { files } = await collect(stream)

		expect(files).toHaveLength(0)
	})

	test(`Plugin should correctly merge svg files`, async () => {
		let stream = stacksvg()

		stream.write(new Vinyl({
			path: `circle.svg`,
			contents: Buffer.from(`<svg viewBox="0 0 4 4" preserveAspectRatio="xMinYMid meet"><circle cx="2" cy="2" r="1"/></svg>`),
		}))

		stream.write(new Vinyl({
			path: `square.svg`,
			contents: Buffer.from(`<svg><rect x="1" y="1" width="2" height="2"/></svg>`),
		}))

		let { files } = await collect(stream)
		let actual = contentsOf(files[0])
		let expected = `<svg xmlns="http://www.w3.org/2000/svg"><style>:root svg:not(:target){display:none}</style><svg viewBox="0 0 4 4" preserveAspectRatio="xMinYMid meet" id="circle"><circle cx="2" cy="2" r="1"/></svg><svg id="square"><rect x="1" y="1" width="2" height="2"/></svg></svg>`

		expect(actual).toBe(expected)
	})

	test(`Plugin should not include null`, async () => {
		let stream = stacksvg()

		stream.write(new Vinyl({
			path: `circle.svg`,
			contents: Buffer.from(`<svg viewBox="0 0 4 4"><circle cx="2" cy="2" r="1"/></svg>`),
		}))

		stream.write(new Vinyl({
			path: `square.svg`,
			contents: null,
		}))

		let { files } = await collect(stream)
		let actual = contentsOf(files[0])
		let expected = `<svg xmlns="http://www.w3.org/2000/svg"><style>:root svg:not(:target){display:none}</style><svg viewBox="0 0 4 4" id="circle"><circle cx="2" cy="2" r="1"/></svg></svg>`

		expect(actual).toBe(expected)
	})

	test(`Plugin should emit error if files have the same name`, async () => {
		let stream = stacksvg()

		stream.write(new Vinyl({
			path: `circle.svg`,
			contents: Buffer.from(`<svg></svg>`),
		}))
		stream.write(new Vinyl({
			path: `circle.svg`,
			contents: Buffer.from(`<svg></svg>`),
		}))

		let { error } = await collect(stream)

		expect(error).toBeInstanceOf(PluginError)
		expect(errorMessageOf(error)).toBe(`File name should be unique: circle`)
	})

	test(`Plugin should generate stack.svg`, async () => {
		let stream = stacksvg()

		stream.write(new Vinyl({
			path: `circle.svg`,
			contents: Buffer.from(`<svg/>`),
		}))

		stream.write(new Vinyl({
			path: `square.svg`,
			contents: Buffer.from(`<svg/>`),
		}))

		let { files } = await collect(stream)

		expect(files[0].relative).toBe(`stack.svg`)
	})

	test(`Plugin should emit error for streamed files`, async () => {
		let stream = stacksvg()

		stream.write(new Vinyl({
			path: `circle.svg`,
			contents: Readable.from([`<svg/>`]),
		}))

		let { error } = await collect(stream)

		expect(error).toBeInstanceOf(PluginError)
		expect(errorMessageOf(error)).toBe(`Streams are not supported!`)
	})
})
