/* global describe, it, beforeEach, afterEach */
import { strictEqual, ok } from "assert"

import { stacksvg } from "./index.js"
import fancyLog from "fancy-log"
import PluginError from "plugin-error"
import sinon from "sinon"
import Vinyl from "vinyl"

describe(`gulp-stacksvg unit test`, () => {
	beforeEach(() => { sinon.stub(fancyLog, `info`) })
	afterEach(() => { sinon.restore() })

	it(`should not create empty svg file`, (done) => {
		const stream = stacksvg()
		let isEmpty = true

		stream.on(`data`, () => { isEmpty = false })

		stream.on(`end`, () => {
			ok(isEmpty, `Created empty svg`)
			done()
		})

		stream.end()
	})

	it(`should correctly merge svg files`, (done) => {
		const stream = stacksvg()

		stream.on(`data`, (file) => {
			const result = file.contents.toString()
			const target = `<svg xmlns="http://www.w3.org/2000/svg"><style>:root svg:not(:target){display:none}</style><svg viewBox="0 0 4 4" preserveAspectRatio="xMinYMid meet" id="circle"><circle cx="2" cy="2" r="1"></circle></svg><svg id="square"><rect x="1" y="1" width="2" height="2"></rect></svg></svg>`
			strictEqual(result, target)
			done()
		})

		stream.write(new Vinyl({
			contents: Buffer.from(`<svg viewBox="0 0 4 4" preserveAspectRatio="xMinYMid meet"><circle cx="2" cy="2" r="1"/></svg>`),
			path: `circle.svg`
		}))

		stream.write(new Vinyl({
			contents: Buffer.from(`<svg><rect x="1" y="1" width="2" height="2"/></svg>`),
			path: `square.svg`
		}))

		stream.end()
	})

	it(`should not include null`, (done) => {
		const stream = stacksvg()

		stream.on(`data`, (file) => {
			const result = file.contents.toString()
			const target = `<svg xmlns="http://www.w3.org/2000/svg"><style>:root svg:not(:target){display:none}</style><svg viewBox="0 0 4 4" id="circle"><circle cx="2" cy="2" r="1"></circle></svg></svg>`
			strictEqual(result, target)
			done()
		})

		stream.write(new Vinyl({
			contents: Buffer.from(`<svg viewBox="0 0 4 4"><circle cx="2" cy="2" r="1"/></svg>`),
			path: `circle.svg`
		}))

		stream.write(new Vinyl({
			contents: null,
			path: `square.svg`
		}))

		stream.end()
	})

	it(`should not include invalid files`, (done) => {
		const stream = stacksvg()

		stream.on(`data`, (file) => {
			const result = file.contents.toString()
			const target = `<svg xmlns="http://www.w3.org/2000/svg"><style>:root svg:not(:target){display:none}</style><svg viewBox="0 0 4 4" id="circle"><circle cx="2" cy="2" r="1"></circle></svg></svg>`
			strictEqual(result, target)
			done()
		})

		stream.write(new Vinyl({
			contents: Buffer.from(`<svg viewBox="0 0 4 4"><circle cx="2" cy="2" r="1"/></svg>`),
			path: `circle.svg`
		}))

		stream.write(new Vinyl({
			contents: Buffer.from(`not an svg`),
			path: `square.svg`
		}))

		stream.end()
	})

	it(`should emit error if files have the same name`, (done) => {
		const stream = stacksvg()

		stream.on(`error`, (error) => {
			ok(error instanceof PluginError)
			strictEqual(error.message, `File name should be unique: circle`)
			done()
		})

		stream.write(new Vinyl({ contents: Buffer.from(`<svg></svg>`), path: `circle.svg` }))
		stream.write(new Vinyl({ contents: Buffer.from(`<svg></svg>`), path: `circle.svg` }))

		stream.end()
	})

	it(`should generate stack.svg if output filename is not passed`, (done) => {
		const stream = stacksvg()

		stream.on(`data`, (file) => {
			strictEqual(file.relative, `stack.svg`)
			done()
		})

		stream.write(new Vinyl({
			contents: Buffer.from(`<svg/>`),
			path: `circle.svg`
		}))

		stream.write(new Vinyl({
			contents: Buffer.from(`<svg/>`),
			path: `square.svg`
		}))

		stream.end()
	})

	it(`should add .svg if passed output doesn't end with this`, (done) => {
		const stream = stacksvg({ output: `test`})

		stream.on(`data`, (file) => {
			strictEqual(file.relative, `test.svg`)
			done()
		})

		stream.write(new Vinyl({
			contents: Buffer.from(`<svg/>`),
			path: `circle.svg`
		}))

		stream.write(new Vinyl({
			contents: Buffer.from(`<svg/>`),
			path: `square.svg`
		}))

		stream.end()
	})

	it(`should not add .svg if passed output ends with this`, (done) => {
		const stream = stacksvg({ output: `test.svg`})

		stream.on(`data`, (file) => {
			strictEqual(file.relative, `test.svg`)
			done()
		})

		stream.write(new Vinyl({
			contents: Buffer.from(`<svg/>`),
			path: `circle.svg`
		}))

		stream.write(new Vinyl({
			contents: Buffer.from(`<svg/>`),
			path: `square.svg`
		}))

		stream.end()
	})

	it(`should replace the space with the hyphen when spacer is not passed`, (done) => {
		const stream = stacksvg()

		stream.on(`data`, (file) => {
			strictEqual(
				`<svg xmlns="http://www.w3.org/2000/svg"><style>:root svg:not(:target){display:none}</style><svg id="icon-like"></svg></svg>`,
				file.contents.toString()
			)
			done()
		})

		stream.write(new Vinyl({
			contents: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg"/>`),
			path: `icon like.svg`
		}))

		stream.end()
	})

	it(`should replace the space with the passed spacer option`, (done) => {
		const stream = stacksvg({ spacer: `--` })

		stream.on(`data`, (file) => {
			strictEqual(
				`<svg xmlns="http://www.w3.org/2000/svg"><style>:root svg:not(:target){display:none}</style><svg id="icon--like"></svg></svg>`,
				file.contents.toString()
			)
			done()
		})

		stream.write(new Vinyl({
			contents: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg"/>`),
			path: `icon like.svg`
		}))

		stream.end()
	})

	it(`Should remove the space if an empty string is passed to spacer option`, (done) => {
		const stream = stacksvg({ spacer: `` })

		stream.on(`data`, (file) => {
			strictEqual(
				`<svg xmlns="http://www.w3.org/2000/svg"><style>:root svg:not(:target){display:none}</style><svg id="iconlike"></svg></svg>`,
				file.contents.toString()
			)
			done()
		})

		stream.write(new Vinyl({
			contents: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg"/>`),
			path: `icon like.svg`
		}))

		stream.end()
	})

	it(`should replace the directory separator with the underscore`, (done) => {
		const stream = stacksvg()

		stream.on(`data`, (file) => {
			strictEqual(
				`<svg xmlns="http://www.w3.org/2000/svg"><style>:root svg:not(:target){display:none}</style><svg id="icons_like"></svg></svg>`,
				file.contents.toString()
			)
			done()
		})

		stream.write(new Vinyl({
			contents: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg"/>`),
			path: `icons/like.svg`
		}))

		stream.end()
	})

	it(`should replace the directory separator with the passed separator option`, (done) => {
		const stream = stacksvg({ separator: `__` })

		stream.on(`data`, (file) => {
			strictEqual(
				`<svg xmlns="http://www.w3.org/2000/svg"><style>:root svg:not(:target){display:none}</style><svg id="icons__like"></svg></svg>`,
				file.contents.toString()
			)
			done()
		})

		stream.write(new Vinyl({
			contents: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg"/>`),
			path: `icons/like.svg`
		}))

		stream.end()
	})

	it(`should remove the directory separator if an empty string is passed to separator option`, (done) => {
		const stream = stacksvg({ separator: `` })

		stream.on(`data`, (file) => {
			strictEqual(
				`<svg xmlns="http://www.w3.org/2000/svg"><style>:root svg:not(:target){display:none}</style><svg id="iconslike"></svg></svg>`,
				file.contents.toString()
			)
			done()
		})

		stream.write(new Vinyl({
			contents: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg"/>`),
			path: `icons/like.svg`
		}))

		stream.end()
	})

	it(`should generate unique inner id`, (done) => {
		const stream = stacksvg()

		stream.on(`data`, (file) => {
			strictEqual(
				`<svg xmlns="http://www.w3.org/2000/svg"><style>:root svg:not(:target){display:none}</style><svg viewBox="0 0 40 40" id="one"><mask id="one_0"></mask><mask id="one_1"></mask><g><mask id="one_2"></mask></g><path mask="url(#one_0)"></path><g><path mask="url(#one_1)"></path><g><path mask="url(#one_2)"></path></g></g></svg><svg viewBox="0 0 40 40" id="two"><mask id="two_0"></mask><mask id="two_1"></mask><g><mask id="two_2"></mask></g><path mask="url(#two_0)"></path><g><path mask="url(#two_1)"></path><g><path mask="url(#two_2)"></path></g></g></svg></svg>`,
				file.contents.toString()
			)
			done()
		})

		stream.write(new Vinyl({
			contents: Buffer.from(`<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"><mask id="a"/><mask id="b"/><g><mask id="c"/></g><path mask="url(#a)"/><g><path mask="url(#b)"/><g><path mask="url(#c)"/></g></g></svg>`),
			path: `one.svg`
		}))

		stream.write(new Vinyl({
			contents: Buffer.from(`<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"><mask id="a"/><mask id="b"/><g><mask id="c"/></g><path mask="url(#a)"/><g><path mask="url(#b)"/><g><path mask="url(#c)"/></g></g></svg>`),
			path: `two.svg`
		}))

		stream.end()
	})

	it(`should include all different namespaces into final svg`, (done) => {
		const stream = stacksvg()

		stream.on(`data`, (file) => {
			strictEqual(
				`<svg xmlns="http://www.w3.org/2000/svg" xmlns:ns1="https://example.com/ns/ns1" xmlns:ns2="https://example.com/ns/ns2"><style>:root svg:not(:target){display:none}</style><svg id="rect1"><rect ns1:width="50" ns1:height="10"></rect></svg><svg id="rect2"><ns2:rect width="50" height="10"></ns2:rect></svg></svg>`,
				file.contents.toString())
			done()
		})

		stream.write(new Vinyl({
			contents: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" xmlns:ns1="https://example.com/ns/ns1"><rect ns1:width="50" ns1:height="10"/></svg>`),
			path: `rect1.svg`
		}))

		stream.write(new Vinyl({
			contents: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" xmlns:ns2="https://example.com/ns/ns2"><ns2:rect width="50" height="10"/></svg>`),
			path: `rect2.svg`
		}))

		stream.end()
	})

	it(`should replace aliases of existing namespaces`, (done) => {
		const stream = stacksvg()

		stream.on(`data`, (file) => {
			strictEqual(
				`<svg xmlns="http://www.w3.org/2000/svg" xmlns:ns1="https://example.com/ns/ns1"><style>:root svg:not(:target){display:none}</style><svg id="rect1"><rect ns1:width="50" ns1:height="10"></rect></svg><svg id="rect2"><ns1:rect ns1:width="50" ns1:height="10"></ns1:rect></svg></svg>`,
				file.contents.toString()
			)
			done()
		})

		stream.write(new Vinyl({
			contents: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" xmlns:ns1="https://example.com/ns/ns1"><rect ns1:width="50" ns1:height="10"/></svg>`),
			path: `rect1.svg`
		}))

		stream.write(new Vinyl({
			contents: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" xmlns:ns2="https://example.com/ns/ns1"><ns2:rect ns2:width="50" ns2:height="10"/></svg>`),
			path: `rect2.svg`
		}))

		stream.end()
	})

	it(`should rename duplicate aliases of different namespaces`, (done) => {
		const stream = stacksvg()

		stream.on(`data`, (file) => {
			strictEqual(
				`<svg xmlns="http://www.w3.org/2000/svg" xmlns:ns="https://example.com/ns/ns1" xmlns:nsf37e589="https://example.com/ns/ns2" xmlns:ns8467673="https://example.com/ns/ns3"><style>:root svg:not(:target){display:none}</style><svg id="rect1"><rect ns:width="50" ns:height="10"></rect></svg><svg id="rect2"><rect nsf37e589:width="50" nsf37e589:height="10"></rect></svg><svg id="rect3"><ns8467673:rect width="50" height="10"></ns8467673:rect></svg></svg>`,
				file.contents.toString()
			)
			done()
		})

		stream.write(new Vinyl({
			contents: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" xmlns:ns="https://example.com/ns/ns1"><rect ns:width="50" ns:height="10"/></svg>`),
			path: `rect1.svg`
		}))

		stream.write(new Vinyl({
			contents: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" xmlns:ns="https://example.com/ns/ns2"><rect ns:width="50" ns:height="10"/></svg>`),
			path: `rect2.svg`
		}))

		stream.write(new Vinyl({
			contents: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" xmlns:ns="https://example.com/ns/ns3"><ns:rect width="50" height="10"/></svg>`),
			path: `rect3.svg`
		}))

		stream.end()
	})

	it(`should remove "http://www.w3.org/1999/xlink" namespace`, (done) => {
		const stream = stacksvg()

		stream.on(`data`, (file) => {
			strictEqual(
				`<svg xmlns="http://www.w3.org/2000/svg"><style>:root svg:not(:target){display:none}</style><svg viewBox="0 0 50 50" id="burger"><path id="burger_0" d="m8 8h34" stroke="#000" stroke-width="8"></path><use y="17" href="#burger_0"></use><use y="34" href="#burger_0"></use></svg><svg viewBox="0 0 50 50" id="sandwich"><path id="sandwich_0" d="m8 8h34" stroke="#000" stroke-width="8"></path><use y="17" href="#sandwich_0"></use><use y="34" href="#sandwich_0"></use></svg></svg>`,
				file.contents.toString())
			done()
		})

		stream.write(new Vinyl({
			contents: Buffer.from(`<svg viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><path id="a" d="m8 8h34" stroke="#000" stroke-width="8"/><use y="17" xlink:href="#a"/><use y="34" xlink:href="#a"/></svg>`),
			path: `burger.svg`
		}))

		stream.write(new Vinyl({
			contents: Buffer.from(`<svg viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><path id="a" d="m8 8h34" stroke="#000" stroke-width="8"/><use y="17" xlink:href="#a"/><use y="34" xlink:href="#a"/></svg>`),
			path: `sandwich.svg`
		}))

		stream.end()
	})

	it(`should not add unused namespaces`, (done) => {
		const stream = stacksvg()

		stream.on(`data`, (file) => {
			strictEqual(
				file.contents.toString(),
				`<svg xmlns="http://www.w3.org/2000/svg"><style>:root svg:not(:target){display:none}</style><svg id="rect1"><rect width="50" height="10"></rect></svg><svg id="rect2"><rect width="50" height="10"></rect></svg></svg>`
			)
			done()
		})

		stream.write(new Vinyl({
			contents: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" xmlns:ns1="https://example.com/ns/ns1"><rect width="50" height="10"/></svg>`),
			path: `rect1.svg`
		}))

		stream.write(new Vinyl({
			contents: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" xmlns:ns2="https://example.com/ns/ns2"><rect width="50" height="10"/></svg>`),
			path: `rect2.svg`
		}))

		stream.end()
	})
})
