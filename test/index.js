import { test } from "node:test"
import { equal, ok } from "node:assert/strict"

import PluginError from "plugin-error"
import Vinyl from "vinyl"

import { stacksvg } from "../lib/index.js"

test(`Plugin should not create empty svg file`, () => {
	let stream = stacksvg()
	let isEmpty = true

	stream.on(`data`, () => { isEmpty = false })

	stream.on(`end`, () => {
		ok(isEmpty, `Created empty svg`)
	})

	stream.end()
})

test(`Plugin should correctly merge svg files`, () => {
	let stream = stacksvg()

	stream.on(`data`, (file) => {
		let actual = file.contents.toString()
		let expected = `<svg xmlns="http://www.w3.org/2000/svg"><style>:root svg:not(:target){display:none}</style><svg viewBox="0 0 4 4" preserveAspectRatio="xMinYMid meet" id="circle"><circle cx="2" cy="2" r="1"></circle></svg><svg id="square"><rect x="1" y="1" width="2" height="2"></rect></svg></svg>`

		equal(actual, expected)
	})

	stream.write(new Vinyl({
		path: `circle.svg`,
		contents: Buffer.from(`<svg viewBox="0 0 4 4" preserveAspectRatio="xMinYMid meet"><circle cx="2" cy="2" r="1"/></svg>`),
	}))

	stream.write(new Vinyl({
		path: `square.svg`,
		contents: Buffer.from(`<svg><rect x="1" y="1" width="2" height="2"/></svg>`),
	}))

	stream.end()
})

test(`Plugin should not include null`, () => {
	let stream = stacksvg()

	stream.on(`data`, (file) => {
		let actual = file.contents.toString()
		let expected = `<svg xmlns="http://www.w3.org/2000/svg"><style>:root svg:not(:target){display:none}</style><svg viewBox="0 0 4 4" id="circle"><circle cx="2" cy="2" r="1"></circle></svg></svg>`

		equal(actual, expected)
	})

	stream.write(new Vinyl({
		path: `circle.svg`,
		contents: Buffer.from(`<svg viewBox="0 0 4 4"><circle cx="2" cy="2" r="1"/></svg>`),
	}))

	stream.write(new Vinyl({
		path: `square.svg`,
		contents: null,
	}))

	stream.end()
})

test(`Plugin should not include invalid files`, () => {
	let stream = stacksvg()

	stream.on(`data`, (file) => {
		let actual = file.contents.toString()
		let expected = `<svg xmlns="http://www.w3.org/2000/svg"><style>:root svg:not(:target){display:none}</style><svg viewBox="0 0 4 4" id="circle"><circle cx="2" cy="2" r="1"></circle></svg></svg>`

		equal(actual, expected)
	})

	stream.write(new Vinyl({
		path: `circle.svg`,
		contents: Buffer.from(`<svg viewBox="0 0 4 4"><circle cx="2" cy="2" r="1"/></svg>`),
	}))

	stream.write(new Vinyl({
		path: `square.svg`,
		contents: Buffer.from(`not an svg`),
	}))

	stream.end()
})

test(`Plugin should emit error if files have the same name`, () => {
	let stream = stacksvg()

	stream.on(`error`, (error) => {
		ok(error instanceof PluginError)
		equal(error.message, `File name should be unique: circle`)
	})

	stream.write(new Vinyl({
		path: `circle.svg`,
		contents: Buffer.from(`<svg></svg>`),
	}))
	stream.write(new Vinyl({
		path: `circle.svg`,
		contents: Buffer.from(`<svg></svg>`),
	}))

	stream.end()
})

test(`Plugin should generate stack.svg`, () => {
	let stream = stacksvg()

	stream.on(`data`, (file) => {
		equal(file.relative, `stack.svg`)
	})

	stream.write(new Vinyl({
		path: `circle.svg`,
		contents: Buffer.from(`<svg/>`),
	}))

	stream.write(new Vinyl({
		path: `square.svg`,
		contents: Buffer.from(`<svg/>`),
	}))

	stream.end()
})

test(`Plugin should replace the spaces with the hyphens`, () => {
	let stream = stacksvg()

	stream.on(`data`, (file) => {
		let actual = file.contents.toString()
		let expected = `<svg xmlns="http://www.w3.org/2000/svg"><style>:root svg:not(:target){display:none}</style><svg id="icon-like"></svg></svg>`

		equal(actual, expected)
	})

	stream.write(new Vinyl({
		path: `icon like.svg`,
		contents: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg"/>`),
	}))

	stream.end()
})

test(`Plugin should replace the directory separator with the underscore`, () => {
	let stream = stacksvg()

	stream.on(`data`, (file) => {
		let actual = file.contents.toString()
		let expected = `<svg xmlns="http://www.w3.org/2000/svg"><style>:root svg:not(:target){display:none}</style><svg id="icons_like"></svg></svg>`

		equal(actual, expected)
	})

	stream.write(new Vinyl({
		path: `icons/like.svg`,
		contents: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg"/>`),
	}))

	stream.end()
})

test(`Plugin should generate unique inner id`, () => {
	let stream = stacksvg()

	stream.on(`data`, (file) => {
		let actual = file.contents.toString()
		let expected = `<svg xmlns="http://www.w3.org/2000/svg"><style>:root svg:not(:target){display:none}</style><svg viewBox="0 0 40 40" id="one"><mask id="one_0"></mask><mask id="one_1"></mask><g><mask id="one_2"></mask></g><path mask="url(#one_0)"></path><g><path mask="url(#one_1)"></path><g><path mask="url(#one_2)"></path></g></g></svg><svg viewBox="0 0 40 40" id="two"><mask id="two_0"></mask><mask id="two_1"></mask><g><mask id="two_2"></mask></g><path mask="url(#two_0)"></path><g><path mask="url(#two_1)"></path><g><path mask="url(#two_2)"></path></g></g></svg></svg>`

		equal(actual, expected)
	})

	stream.write(new Vinyl({
		path: `one.svg`,
		contents: Buffer.from(`<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"><mask id="a"/><mask id="b"/><g><mask id="c"/></g><path mask="url(#a)"/><g><path mask="url(#b)"/><g><path mask="url(#c)"/></g></g></svg>`),
	}))

	stream.write(new Vinyl({
		path: `two.svg`,
		contents: Buffer.from(`<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"><mask id="a"/><mask id="b"/><g><mask id="c"/></g><path mask="url(#a)"/><g><path mask="url(#b)"/><g><path mask="url(#c)"/></g></g></svg>`),
	}))

	stream.end()
})

test(`Plugin should include all different namespaces into final svg`, () => {
	let stream = stacksvg()

	stream.on(`data`, (file) => {
		let actual = file.contents.toString()
		let expected = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:ns1="https://example.com/ns/ns1" xmlns:ns2="https://example.com/ns/ns2"><style>:root svg:not(:target){display:none}</style><svg id="rect1"><rect ns1:width="50" ns1:height="10"></rect></svg><svg id="rect2"><ns2:rect width="50" height="10"></ns2:rect></svg></svg>`

		equal(actual, expected)
	})

	stream.write(new Vinyl({
		path: `rect1.svg`,
		contents: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" xmlns:ns1="https://example.com/ns/ns1"><rect ns1:width="50" ns1:height="10"/></svg>`),
	}))

	stream.write(new Vinyl({
		path: `rect2.svg`,
		contents: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" xmlns:ns2="https://example.com/ns/ns2"><ns2:rect width="50" height="10"/></svg>`),
	}))

	stream.end()
})

test(`Plugin should replace aliases of existing namespaces`, () => {
	let stream = stacksvg()

	stream.on(`data`, (file) => {
		let actual = file.contents.toString()
		let expected = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:ns1="https://example.com/ns/ns1"><style>:root svg:not(:target){display:none}</style><svg id="rect1"><rect ns1:width="50" ns1:height="10"></rect></svg><svg id="rect2"><ns1:rect ns1:width="50" ns1:height="10"></ns1:rect></svg></svg>`

		equal(actual, expected)
	})

	stream.write(new Vinyl({
		path: `rect1.svg`,
		contents: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" xmlns:ns1="https://example.com/ns/ns1"><rect ns1:width="50" ns1:height="10"/></svg>`),
	}))

	stream.write(new Vinyl({
		path: `rect2.svg`,
		contents: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" xmlns:ns2="https://example.com/ns/ns1"><ns2:rect ns2:width="50" ns2:height="10"/></svg>`),
	}))

	stream.end()
})

test(`Plugin should rename duplicate aliases of different namespaces`, () => {
	let stream = stacksvg()

	stream.on(`data`, (file) => {
		let actual = file.contents.toString()
		let expected = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:ns="https://example.com/ns/ns1" xmlns:nsf37e589="https://example.com/ns/ns2" xmlns:ns8467673="https://example.com/ns/ns3"><style>:root svg:not(:target){display:none}</style><svg id="rect1"><rect ns:width="50" ns:height="10"></rect></svg><svg id="rect2"><rect nsf37e589:width="50" nsf37e589:height="10"></rect></svg><svg id="rect3"><ns8467673:rect width="50" height="10"></ns8467673:rect></svg></svg>`

		equal(actual, expected)
	})

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

	stream.end()
})

test(`Plugin should remove "http://www.w3.org/1999/xlink" namespace`, () => {
	let stream = stacksvg()

	stream.on(`data`, (file) => {
		let actual = file.contents.toString()
		let expected = `<svg xmlns="http://www.w3.org/2000/svg"><style>:root svg:not(:target){display:none}</style><svg viewBox="0 0 50 50" id="burger"><path id="burger_0" d="m8 8h34" stroke="#000" stroke-width="8"></path><use y="17" href="#burger_0"></use><use y="34" href="#burger_0"></use></svg><svg viewBox="0 0 50 50" id="sandwich"><path id="sandwich_0" d="m8 8h34" stroke="#000" stroke-width="8"></path><use y="17" href="#sandwich_0"></use><use y="34" href="#sandwich_0"></use></svg></svg>`

		equal(actual, expected)
	})

	stream.write(new Vinyl({
		path: `burger.svg`,
		contents: Buffer.from(`<svg viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><path id="a" d="m8 8h34" stroke="#000" stroke-width="8"/><use y="17" xlink:href="#a"/><use y="34" xlink:href="#a"/></svg>`),
	}))

	stream.write(new Vinyl({
		path: `sandwich.svg`,
		contents: Buffer.from(`<svg viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><path id="a" d="m8 8h34" stroke="#000" stroke-width="8"/><use y="17" xlink:href="#a"/><use y="34" xlink:href="#a"/></svg>`),
	}))

	stream.end()
})

test(`Plugin should not add unused namespaces`, () => {
	let stream = stacksvg()

	stream.on(`data`, (file) => {
		let actual = file.contents.toString()
		let expected = `<svg xmlns="http://www.w3.org/2000/svg"><style>:root svg:not(:target){display:none}</style><svg id="rect1"><rect width="50" height="10"></rect></svg><svg id="rect2"><rect width="50" height="10"></rect></svg></svg>`

		equal(actual, expected)
	})

	stream.write(new Vinyl({
		path: `rect1.svg`,
		contents: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" xmlns:ns1="https://example.com/ns/ns1"><rect width="50" height="10"/></svg>`),
	}))

	stream.write(new Vinyl({
		path: `rect2.svg`,
		contents: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" xmlns:ns2="https://example.com/ns/ns2"><rect width="50" height="10"/></svg>`),
	}))

	stream.end()
})
