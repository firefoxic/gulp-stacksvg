import { Readable } from "node:stream"

import PluginError from "plugin-error"
import Vinyl from "vinyl"
import { describe, expect, test } from "vitest"

import { stacksvg } from "../../src/index.js"

function collect (stream) {
	return new Promise((resolve) => {
		let files = []
		let error = null

		stream.on(`data`, (file) => { files.push(file) })
		stream.on(`error`, (err) => {
			error = err
			resolve({ files, error })
		})
		stream.on(`end`, () => { resolve({ files, error }) })

		stream.end()
	})
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
		let actual = files[0].contents.toString()
		let expected = `<svg xmlns="http://www.w3.org/2000/svg"><style>:root svg:not(:target){display:none}</style><svg viewBox="0 0 4 4" preserveAspectRatio="xMinYMid meet" id="circle"><circle cx="2" cy="2" r="1"></circle></svg><svg id="square"><rect x="1" y="1" width="2" height="2"></rect></svg></svg>`

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
		let actual = files[0].contents.toString()
		let expected = `<svg xmlns="http://www.w3.org/2000/svg"><style>:root svg:not(:target){display:none}</style><svg viewBox="0 0 4 4" id="circle"><circle cx="2" cy="2" r="1"></circle></svg></svg>`

		expect(actual).toBe(expected)
	})

	test(`Plugin should not include invalid files`, async () => {
		let stream = stacksvg()

		stream.write(new Vinyl({
			path: `circle.svg`,
			contents: Buffer.from(`<svg viewBox="0 0 4 4"><circle cx="2" cy="2" r="1"/></svg>`),
		}))

		stream.write(new Vinyl({
			path: `square.svg`,
			contents: Buffer.from(`not an svg`),
		}))

		let { files } = await collect(stream)
		let actual = files[0].contents.toString()
		let expected = `<svg xmlns="http://www.w3.org/2000/svg"><style>:root svg:not(:target){display:none}</style><svg viewBox="0 0 4 4" id="circle"><circle cx="2" cy="2" r="1"></circle></svg></svg>`

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
		expect(error.message).toBe(`File name should be unique: circle`)
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

	test(`Plugin should replace the spaces with the hyphens`, async () => {
		let stream = stacksvg()

		stream.write(new Vinyl({
			path: `icon like.svg`,
			contents: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg"/>`),
		}))

		let { files } = await collect(stream)
		let actual = files[0].contents.toString()
		let expected = `<svg xmlns="http://www.w3.org/2000/svg"><style>:root svg:not(:target){display:none}</style><svg id="icon-like"></svg></svg>`

		expect(actual).toBe(expected)
	})

	test(`Plugin should replace the directory separator with the underscore`, async () => {
		let stream = stacksvg()

		stream.write(new Vinyl({
			path: `icons/like.svg`,
			contents: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg"/>`),
		}))

		let { files } = await collect(stream)
		let actual = files[0].contents.toString()
		let expected = `<svg xmlns="http://www.w3.org/2000/svg"><style>:root svg:not(:target){display:none}</style><svg id="icons_like"></svg></svg>`

		expect(actual).toBe(expected)
	})

	test(`Plugin should generate unique inner id`, async () => {
		let stream = stacksvg()

		stream.write(new Vinyl({
			path: `one.svg`,
			contents: Buffer.from(`<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"><mask id="a"/><mask id="b"/><g><mask id="c"/></g><path mask="url(#a)"/><g><path mask="url(#b)"/><g><path mask="url(#c)"/></g></g></svg>`),
		}))

		stream.write(new Vinyl({
			path: `two.svg`,
			contents: Buffer.from(`<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"><mask id="a"/><mask id="b"/><g><mask id="c"/></g><path mask="url(#a)"/><g><path mask="url(#b)"/><g><path mask="url(#c)"/></g></g></svg>`),
		}))

		let { files } = await collect(stream)
		let actual = files[0].contents.toString()
		let expected = `<svg xmlns="http://www.w3.org/2000/svg"><style>:root svg:not(:target){display:none}</style><svg viewBox="0 0 40 40" id="one"><mask id="one_0"></mask><mask id="one_1"></mask><g><mask id="one_2"></mask></g><path mask="url(#one_0)"></path><g><path mask="url(#one_1)"></path><g><path mask="url(#one_2)"></path></g></g></svg><svg viewBox="0 0 40 40" id="two"><mask id="two_0"></mask><mask id="two_1"></mask><g><mask id="two_2"></mask></g><path mask="url(#two_0)"></path><g><path mask="url(#two_1)"></path><g><path mask="url(#two_2)"></path></g></g></svg></svg>`

		expect(actual).toBe(expected)
	})

	test(`Plugin should update every reference within one attribute`, async () => {
		let stream = stacksvg()

		stream.write(new Vinyl({
			path: `icon.svg`,
			contents: Buffer.from(`<svg viewBox="0 0 10 10"><mask id="a"/><path style="fill:url(#a);mask:url(#a)"/></svg>`),
		}))

		let { files } = await collect(stream)
		let actual = files[0].contents.toString()
		let expected = `<svg xmlns="http://www.w3.org/2000/svg"><style>:root svg:not(:target){display:none}</style><svg viewBox="0 0 10 10" id="icon"><mask id="icon_0"></mask><path style="fill:url(#icon_0);mask:url(#icon_0)"></path></svg></svg>`

		expect(actual).toBe(expected)
	})

	test(`Plugin should include all different namespaces into final svg`, async () => {
		let stream = stacksvg()

		stream.write(new Vinyl({
			path: `rect1.svg`,
			contents: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" xmlns:ns1="https://example.com/ns/ns1"><rect ns1:width="50" ns1:height="10"/></svg>`),
		}))

		stream.write(new Vinyl({
			path: `rect2.svg`,
			contents: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" xmlns:ns2="https://example.com/ns/ns2"><ns2:rect width="50" height="10"/></svg>`),
		}))

		let { files } = await collect(stream)
		let actual = files[0].contents.toString()
		let expected = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:ns1="https://example.com/ns/ns1" xmlns:ns2="https://example.com/ns/ns2"><style>:root svg:not(:target){display:none}</style><svg id="rect1"><rect ns1:width="50" ns1:height="10"></rect></svg><svg id="rect2"><ns2:rect width="50" height="10"></ns2:rect></svg></svg>`

		expect(actual).toBe(expected)
	})

	test(`Plugin should replace aliases of existing namespaces`, async () => {
		let stream = stacksvg()

		stream.write(new Vinyl({
			path: `rect1.svg`,
			contents: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" xmlns:ns1="https://example.com/ns/ns1"><rect ns1:width="50" ns1:height="10"/></svg>`),
		}))

		stream.write(new Vinyl({
			path: `rect2.svg`,
			contents: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" xmlns:ns2="https://example.com/ns/ns1"><ns2:rect ns2:width="50" ns2:height="10"/></svg>`),
		}))

		let { files } = await collect(stream)
		let actual = files[0].contents.toString()
		let expected = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:ns1="https://example.com/ns/ns1"><style>:root svg:not(:target){display:none}</style><svg id="rect1"><rect ns1:width="50" ns1:height="10"></rect></svg><svg id="rect2"><ns1:rect ns1:width="50" ns1:height="10"></ns1:rect></svg></svg>`

		expect(actual).toBe(expected)
	})

	test(`Plugin should rename duplicate aliases of different namespaces`, async () => {
		let stream = stacksvg()

		stream.write(new Vinyl({
			path: `rect1.svg`,
			contents: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" xmlns:ns="https://example.com/ns/ns1"><rect ns:width="50" ns:height="10"/></svg>`),
		}))

		stream.write(new Vinyl({
			path: `rect2.svg`,
			contents: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" xmlns:ns="https://example.com/ns/ns2"><rect ns:width="50" ns:height="10"/></svg>`),
		}))

		stream.write(new Vinyl({
			path: `rect3.svg`,
			contents: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" xmlns:ns="https://example.com/ns/ns3"><ns:rect width="50" height="10"/></svg>`),
		}))

		let { files } = await collect(stream)
		let actual = files[0].contents.toString()
		let expected = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:ns="https://example.com/ns/ns1" xmlns:nsf37e589="https://example.com/ns/ns2" xmlns:ns8467673="https://example.com/ns/ns3"><style>:root svg:not(:target){display:none}</style><svg id="rect1"><rect ns:width="50" ns:height="10"></rect></svg><svg id="rect2"><rect nsf37e589:width="50" nsf37e589:height="10"></rect></svg><svg id="rect3"><ns8467673:rect width="50" height="10"></ns8467673:rect></svg></svg>`

		expect(actual).toBe(expected)
	})

	test(`Plugin should remove "http://www.w3.org/1999/xlink" namespace`, async () => {
		let stream = stacksvg()

		stream.write(new Vinyl({
			path: `burger.svg`,
			contents: Buffer.from(`<svg viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><path id="a" d="m8 8h34" stroke="#000" stroke-width="8"/><use y="17" xlink:href="#a"/><use y="34" xlink:href="#a"/></svg>`),
		}))

		stream.write(new Vinyl({
			path: `sandwich.svg`,
			contents: Buffer.from(`<svg viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><path id="a" d="m8 8h34" stroke="#000" stroke-width="8"/><use y="17" xlink:href="#a"/><use y="34" xlink:href="#a"/></svg>`),
		}))

		let { files } = await collect(stream)
		let actual = files[0].contents.toString()
		let expected = `<svg xmlns="http://www.w3.org/2000/svg"><style>:root svg:not(:target){display:none}</style><svg viewBox="0 0 50 50" id="burger"><path id="burger_0" d="m8 8h34" stroke="#000" stroke-width="8"></path><use y="17" href="#burger_0"></use><use y="34" href="#burger_0"></use></svg><svg viewBox="0 0 50 50" id="sandwich"><path id="sandwich_0" d="m8 8h34" stroke="#000" stroke-width="8"></path><use y="17" href="#sandwich_0"></use><use y="34" href="#sandwich_0"></use></svg></svg>`

		expect(actual).toBe(expected)
	})

	test(`Plugin should not add unused namespaces`, async () => {
		let stream = stacksvg()

		stream.write(new Vinyl({
			path: `rect1.svg`,
			contents: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" xmlns:ns1="https://example.com/ns/ns1"><rect width="50" height="10"/></svg>`),
		}))

		stream.write(new Vinyl({
			path: `rect2.svg`,
			contents: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" xmlns:ns2="https://example.com/ns/ns2"><rect width="50" height="10"/></svg>`),
		}))

		let { files } = await collect(stream)
		let actual = files[0].contents.toString()
		let expected = `<svg xmlns="http://www.w3.org/2000/svg"><style>:root svg:not(:target){display:none}</style><svg id="rect1"><rect width="50" height="10"></rect></svg><svg id="rect2"><rect width="50" height="10"></rect></svg></svg>`

		expect(actual).toBe(expected)
	})

	test(`Plugin should emit error for streamed files`, async () => {
		let stream = stacksvg()

		stream.write(new Vinyl({
			path: `circle.svg`,
			contents: Readable.from([`<svg/>`]),
		}))

		let { error } = await collect(stream)

		expect(error).toBeInstanceOf(PluginError)
		expect(error.message).toBe(`Streams are not supported!`)
	})

	test(`Plugin should synthesize the viewBox from the width and the height`, async () => {
		let stream = stacksvg()

		stream.write(new Vinyl({
			path: `circle.svg`,
			contents: Buffer.from(`<svg width="24" height="12"><circle cx="2" cy="2" r="1"/></svg>`),
		}))

		let { files } = await collect(stream)
		let actual = files[0].contents.toString()
		let expected = `<svg xmlns="http://www.w3.org/2000/svg"><style>:root svg:not(:target){display:none}</style><svg id="circle" viewBox="0 0 24 12"><circle cx="2" cy="2" r="1"></circle></svg></svg>`

		expect(actual).toBe(expected)
	})

	test(`Plugin should keep the fractional part of the width and the height`, async () => {
		let stream = stacksvg()

		stream.write(new Vinyl({
			path: `circle.svg`,
			contents: Buffer.from(`<svg width="24.5" height="12.5"><circle cx="2" cy="2" r="1"/></svg>`),
		}))

		let { files } = await collect(stream)
		let actual = files[0].contents.toString()
		let expected = `<svg xmlns="http://www.w3.org/2000/svg"><style>:root svg:not(:target){display:none}</style><svg id="circle" viewBox="0 0 24.5 12.5"><circle cx="2" cy="2" r="1"></circle></svg></svg>`

		expect(actual).toBe(expected)
	})

	test(`Plugin should synthesize the viewBox from the pixel width and height`, async () => {
		let stream = stacksvg()

		stream.write(new Vinyl({
			path: `circle.svg`,
			contents: Buffer.from(`<svg width="24px" height="12px"><circle cx="2" cy="2" r="1"/></svg>`),
		}))

		let { files } = await collect(stream)
		let actual = files[0].contents.toString()
		let expected = `<svg xmlns="http://www.w3.org/2000/svg"><style>:root svg:not(:target){display:none}</style><svg id="circle" viewBox="0 0 24 12"><circle cx="2" cy="2" r="1"></circle></svg></svg>`

		expect(actual).toBe(expected)
	})

	test(`Plugin should not synthesize the viewBox from context dependent units`, async () => {
		let stream = stacksvg()

		stream.write(new Vinyl({
			path: `circle.svg`,
			contents: Buffer.from(`<svg width="1em" height="100%"><circle cx="2" cy="2" r="1"/></svg>`),
		}))

		let { files } = await collect(stream)
		let actual = files[0].contents.toString()
		let expected = `<svg xmlns="http://www.w3.org/2000/svg"><style>:root svg:not(:target){display:none}</style><svg id="circle"><circle cx="2" cy="2" r="1"></circle></svg></svg>`

		expect(actual).toBe(expected)
	})

	test(`Plugin should keep the existing viewBox and drop the width and the height`, async () => {
		let stream = stacksvg()

		stream.write(new Vinyl({
			path: `circle.svg`,
			contents: Buffer.from(`<svg viewBox="0 0 4 4" width="24" height="12"><circle cx="2" cy="2" r="1"/></svg>`),
		}))

		let { files } = await collect(stream)
		let actual = files[0].contents.toString()
		let expected = `<svg xmlns="http://www.w3.org/2000/svg"><style>:root svg:not(:target){display:none}</style><svg viewBox="0 0 4 4" id="circle"><circle cx="2" cy="2" r="1"></circle></svg></svg>`

		expect(actual).toBe(expected)
	})

	test(`Plugin should drop the xml prolog and the comments`, async () => {
		let stream = stacksvg()

		stream.write(new Vinyl({
			path: `circle.svg`,
			contents: Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>\n<!-- Generator -->\n<svg viewBox="0 0 4 4"><circle cx="2" cy="2" r="1"/></svg>`),
		}))

		let { files } = await collect(stream)
		let actual = files[0].contents.toString()
		let expected = `<svg xmlns="http://www.w3.org/2000/svg"><style>:root svg:not(:target){display:none}</style><svg viewBox="0 0 4 4" id="circle"><circle cx="2" cy="2" r="1"></circle></svg></svg>`

		expect(actual).toBe(expected)
	})
})
