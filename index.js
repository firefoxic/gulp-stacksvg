import { load } from "cheerio"
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
	const $stack = load(`<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg"><style>:root{visibility:hidden}:target{visibility:visible}</style></svg>`, { xmlMode: true })
	const $rootSvg = $stack(`svg`)
	const stream = new Transform({ objectMode: true })

	function transform (file, _, cb) {

		if (file.isStream()) {
			return cb(new PluginError(`gulp-stacksvg`, `Streams are not supported!`))
		}

		if (file.isNull()) {
			return cb()
		}

		const $icon = load(file.contents.toString(), { xmlMode: true })(`svg`)

		if ($icon.length === 0) {
			return cb()
		}

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
		$icon.attr(`id`, idAttr)

		const viewBoxAttr = $icon.attr(`viewBox`)
		const widthAttr = $icon.attr(`width`)?.replace(/[^0-9]/g, ``)
		const heightAttr = $icon.attr(`height`)?.replace(/[^0-9]/g, ``)

		if (!viewBoxAttr && widthAttr && heightAttr) {
			$icon.attr(`viewBox`, `0 0 ${widthAttr} ${heightAttr}`)
		}

		excessAttrs.forEach((attr) => $icon.removeAttr(attr))

		const attrs = $icon[0].attribs

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

				$icon.removeAttr(attrName)
			}
		}

		$rootSvg.append($icon)
		cb()
	}

	function flush (cb) {
		if (isEmpty) {
			return cb()
		}

		for (let nsName in namespaces) {
			$rootSvg.attr(nsName, namespaces[nsName])
		}

		output = output.endsWith(`.svg`) ? output : `${output}.svg`

		const file = new Vinyl({ path: output, contents: Buffer.from($stack.xml()) })

		this.push(file)
		cb()
	}

	stream._transform = transform
	stream._flush = flush

	return stream
}
