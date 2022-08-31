import { parse } from "node-html-parser"
import { basename, extname, sep } from "path"
import { Transform } from "stream"
import fancyLog from "fancy-log"
import PluginError from "plugin-error"
import Vinyl from "vinyl"

const excessAttrs = [
	`enable-background`,
	`height`,
	`version`,
	`width`,
	`x`,
	`xml:space`,
	`y`
]

export function stacksvg ({ output = `stack.svg`, separator = `_`, spacer = `-` } = {}) {

	let isEmpty = true
	const ids = {}
	const namespaces = {}
	const stack = parse(`<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg"><style>:root{visibility:hidden}:target{visibility:visible}</style></svg>`)
	const rootSvg = stack.querySelector(`svg`)
	const stream = new Transform({ objectMode: true })

	function transform (file, _, cb) {

		if (file.isStream()) {
			return cb(new PluginError(`gulp-stacksvg`, `Streams are not supported!`))
		}

		if (file.isNull() || !parse(file.contents.toString()).querySelector(`svg`)) {
			return cb()
		}

		const icon = parse(file.contents.toString()).querySelector(`svg`)

		if (file && isEmpty) {
			isEmpty = false
		}

		const idAttr = basename(
			file.relative.split(sep).join(separator).replace(/\s/g, spacer),
			extname(file.relative)
		)

		if (idAttr in ids) {
			return cb(new PluginError(`gulp-stacksvg`, `File name should be unique: ${idAttr}`))
		}

		ids[idAttr] = true
		icon.setAttribute(`id`, idAttr)

		const viewBoxAttr = icon.getAttribute(`viewBox`)
		const widthAttr = icon.getAttribute(`width`)?.replace(/[^0-9]/g, ``)
		const heightAttr = icon.getAttribute(`height`)?.replace(/[^0-9]/g, ``)

		if (!viewBoxAttr && widthAttr && heightAttr) {
			icon.setAttribute(`viewBox`, `0 0 ${widthAttr} ${heightAttr}`)
		}

		excessAttrs.forEach((attr) => icon.removeAttribute(attr))

		const attrs = icon._attrs

		for (let attrName in attrs) {
			if (attrName.startsWith(`xmlns`)) {
				const storedNs = namespaces[attrName]
				const attrNs = attrs[attrName]

				if (storedNs !== undefined) {
					if (storedNs !== attrNs) {
						fancyLog.info(`${attrName} namespace appeared multiple times with different value. Keeping the first one : "${storedNs}".\nEach namespace must be unique across files.`)
					}
				} else {
					for (let nsName in namespaces) {
						if (namespaces[nsName] === attrNs) {
							fancyLog.info(`Same namespace value under different names : ${nsName} and ${attrName}.\nKeeping both.`)
						}
					}
					namespaces[attrName] = attrNs
				}

				icon.removeAttribute(attrName)
			}
		}

		rootSvg.appendChild(icon)
		cb()
	}

	function flush (cb) {
		if (isEmpty) {
			return cb()
		}

		for (let nsName in namespaces) {
			rootSvg.setAttribute(nsName, namespaces[nsName])
		}

		output = output.endsWith(`.svg`) ? output : `${output}.svg`

		const file = new Vinyl({ path: output, contents: Buffer.from(stack.toString()) })

		this.push(file)
		cb()
	}

	stream._transform = transform
	stream._flush = flush

	return stream
}
