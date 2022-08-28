import { load } from "cheerio"
import { basename, extname } from "path"
import { Transform } from "stream"
import fancyLog from "fancy-log"
import PluginError from "plugin-error"
import Vinyl from "vinyl"

const presentationAttributes = new Set([
	`alignment-baseline`,
	`baseline-shift`,
	`clip-path`,
	`clip-rule`,
	`clip`,
	`color-interpolation-filters`,
	`color-interpolation`,
	`color-profile`,
	`color-rendering`,
	`color`,
	`cursor`,
	`d`,
	`direction`,
	`display`,
	`dominant-baseline`,
	`enable-background`,
	`fill-opacity`,
	`fill-rule`,
	`fill`,
	`filter`,
	`flood-color`,
	`flood-opacity`,
	`font-family`,
	`font-size-adjust`,
	`font-size`,
	`font-stretch`,
	`font-style`,
	`font-variant`,
	`font-weight`,
	`glyph-orientation-horizontal`,
	`glyph-orientation-vertical`,
	`image-rendering`,
	`kerning`,
	`letter-spacing`,
	`lighting-color`,
	`marker-end`,
	`marker-mid`,
	`marker-start`,
	`mask`,
	`opacity`,
	`overflow`,
	`pointer-events`,
	`shape-rendering`,
	`solid-color`,
	`solid-opacity`,
	`stop-color`,
	`stop-opacity`,
	`stroke-dasharray`,
	`stroke-dashoffset`,
	`stroke-linecap`,
	`stroke-linejoin`,
	`stroke-miterlimit`,
	`stroke-opacity`,
	`stroke-width`,
	`stroke`,
	`style`,
	`text-anchor`,
	`text-decoration`,
	`text-rendering`,
	`transform`,
	`unicode-bidi`,
	`vector-effect`,
	`visibility`,
	`word-spacing`,
	`writing-mode`
])

export function stacksvg (options) {

	options = options || {}

	const namespaces = {}
	let isEmpty = true
	let fileName = options.output || `stack.svg`
	fileName = fileName.endsWith(`.svg`) ? fileName : `${fileName}.svg`
	const ids = {}

	let resultSvg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><style>:root{visibility:hidden}:target{visibility:visible}</style><defs/></svg>`

	const $ = load(resultSvg, { xmlMode: true })
	const $combinedSvg = $(`svg`)
	const $combinedDefs = $(`defs`)
	const stream = new Transform({ objectMode: true })

	stream._transform = function transform (file, _, cb) {

		if (file.isStream()) {
			return cb(new PluginError(`gulp-stacksvg`, `Streams are not supported!`))
		}

		if (file.isNull()) {return cb()}


		const $svg = load(file.contents.toString(), { xmlMode: true })(`svg`)

		if ($svg.length === 0) {return cb()}

		const idAttr = basename(file.relative, extname(file.relative))
		const viewBoxAttr = $svg.attr(`viewBox`)
		const widthAttr = $svg.attr(`width`)
		const heightAttr = $svg.attr(`height`)
		const preserveAspectRatioAttr = $svg.attr(`preserveAspectRatio`)
		const $icon = $(`<svg/>`)

		if (idAttr in ids) {
			return cb(new PluginError(`gulp-stacksvg`, `File name should be unique: ${idAttr}`))
		}

		ids[idAttr] = true

		if (file && isEmpty) {
			isEmpty = false
		}

		$icon.attr(`id`, idAttr)
		if (viewBoxAttr) {
			$icon.attr(`viewBox`, viewBoxAttr)
		} else if (widthAttr && heightAttr) {
			$icon.attr(`viewBox`, `0 0 ${widthAttr.replace(/[^0-9]/g,``)} ${heightAttr.replace(/[^0-9]/g,``)}`)
		}
		if (preserveAspectRatioAttr) {
			$icon.attr(`preserveAspectRatio`, preserveAspectRatioAttr)
		}

		const attrs = $svg[0].attribs
		for (let attrName in attrs) {
			if (attrName.match(/xmlns:.+/)) {
				const storedNs = namespaces[attrName]
				const attrNs = attrs[attrName]

				if (storedNs !== undefined) {
					if (storedNs !== attrNs) {
						fancyLog.info(
							`${attrName} namespace appeared multiple times with different value. Keeping the first one : "${storedNs}".\nEach namespace must be unique across files.`
						)
					}
				} else {
					for (let nsName in namespaces) {
						if (namespaces[nsName] === attrNs) {
							fancyLog.info(`Same namespace value under different names : ${nsName} and ${attrName}.\nKeeping both.`)
						}
					}
					namespaces[attrName] = attrNs
				}
			}
		}

		const $defs = $svg.find(`defs`)
		if ($defs.length > 0) {
			$combinedDefs.append($defs.contents())
			$defs.remove()
		}

		let $groupWrap = null
		for (let [name, value] of Object.entries($svg.attr())) {
			if (!presentationAttributes.has(name)) {continue}
			if (!$groupWrap) {$groupWrap = $(`<g/>`)}
			$groupWrap.attr(name, value)
		}

		if ($groupWrap) {
			$groupWrap.append($svg.contents())
			$icon.append($groupWrap)
		} else {
			$icon.append($svg.contents())
		}
		$combinedSvg.append($icon)
		cb()
	}

	stream._flush = function flush (cb) {
		if (isEmpty) {return cb()}
		if ($combinedDefs.contents().length === 0) {
			$combinedDefs.remove()
		}
		for (let nsName in namespaces) {
			$combinedSvg.attr(nsName, namespaces[nsName])
		}
		const file = new Vinyl({ path: fileName, contents: Buffer.from($.xml()) })
		this.push(file)
		cb()
	}

	return stream
}
