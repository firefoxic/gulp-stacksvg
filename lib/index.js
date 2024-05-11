import { createHmac } from "node:crypto"
import { Transform } from "node:stream"
import { basename, extname, sep } from "node:path"

import { parse } from "node-html-parser"
import PluginError from "plugin-error"
import Vinyl from "vinyl"

const excessAttrs = [
	`enable-background`,
	`height`,
	`version`,
	`width`,
	`x`,
	`xml:space`,
	`y`,
]

const xlink = `http://www.w3.org/1999/xlink`

/**
 * Gulp plugin for combining SVG icons into a single file.
 *
 * @exports {function} stacksvg - Gulp plugin.
 */
export function stacksvg () {
	let isEmpty = true
	const ids = {}
	const namespaces = new Map([[`http://www.w3.org/2000/svg`, `xmlns`]])
	const stack = parse(`<svg><style>:root svg:not(:target){display:none}</style></svg>`)
	const rootSvg = stack.querySelector(`svg`)
	const stream = new Transform({ objectMode: true })

	/**
	 * Transform function for the plugin.
	 *
	 * @param {Vinyl} file - Gulp file object.
	 * @param {string} [enc=null] - Encoding to use when writing the file.
	 * @param {function} cb - Callback function.
	 */
	function transform (file, _, cb) {
		if (file.isStream()) {
			return cb(new PluginError(`gulp-stacksvg`, `Streams are not supported!`))
		}

		if (file.isNull() || !parse(file.contents.toString()).querySelector(`svg`)) {
			return cb()
		}

		const iconDom = parse(file.contents.toString()).removeWhitespace()
		const iconSvg = iconDom.querySelector(`svg`)

		isEmpty = false

		const iconId = basename(
			file.relative.split(sep).join(`_`).replace(/\s/g, `-`),
			extname(file.relative),
		)

		if (iconId in ids) {
			return cb(new PluginError(`gulp-stacksvg`, `File name should be unique: ${iconId}`))
		}

		ids[iconId] = true
		iconSvg.setAttribute(`id`, iconId)

		const viewBoxAttr = iconSvg.getAttribute(`viewBox`)
		const widthAttr = iconSvg.getAttribute(`width`)?.replace(/[^0-9]/g, ``)
		const heightAttr = iconSvg.getAttribute(`height`)?.replace(/[^0-9]/g, ``)

		if (!viewBoxAttr && widthAttr && heightAttr) {
			iconSvg.setAttribute(`viewBox`, `0 0 ${widthAttr} ${heightAttr}`)
		}

		excessAttrs.forEach((attr) => iconSvg.removeAttribute(attr))
		iconSvg.querySelectorAll(`[id]`).forEach(changeInnerId)

		/**
		 * Update the id of a child element if it has the same id.
		 *
		 * @param {Element} targetElem - Child element to update.
		 * @param {string} suffix - Suffix to append to the id.
		 */
		function changeInnerId (targetElem, suffix) {
			let oldId = targetElem.id
			let newId = `${iconId}_${suffix}`

			targetElem.setAttribute(`id`, newId)
			iconSvg.querySelectorAll(`*`).forEach(updateUsingId)

			/**
			 * Update the id of a child element if it has the same id.
			 *
			 * @param {Element} elem - Child element to update.
			 */
			function updateUsingId (elem) {
				if (~elem.rawAttrs.search(`#${oldId}`)) {
					// eslint-disable-next-line guard-for-in
					for (let attr in elem._attrs) {
						let attrValue = elem._attrs[attr].replace(`#${oldId}`, `#${newId}`)

						elem.setAttribute(attr, attrValue)
					}
				}
			}
		}

		const attrs = iconSvg._attrs

		for (let attrName in attrs) {
			if (attrName.startsWith(`xmlns`)) {
				let nsId = attrs[attrName]
				let oldNsAlias = attrName.slice(6)
				let newNsAlias = oldNsAlias

				if (namespaces.has(nsId)) {
					if (namespaces.get(nsId) !== attrName) {
						newNsAlias = namespaces.get(nsId).slice(6)
						changeNsAlias(iconDom, oldNsAlias, newNsAlias)
					}
				} else if (nsId === xlink) {
					newNsAlias = ``
					changeNsAlias(iconDom, oldNsAlias, newNsAlias)
				} else {
					for (let ns of namespaces.values()) {
						if (ns === attrName) {
							newNsAlias = `${oldNsAlias}${getHash(nsId)}`
							changeNsAlias(iconDom, oldNsAlias, newNsAlias)
							break
						}
					}

					iconDom.querySelectorAll(`*`).some((elem) => {
						if (
							elem.rawTagName.startsWith(`${newNsAlias}:`)
							|| Object.keys(elem._attrs).some((attr) => attr.startsWith(`${newNsAlias}:`))
						) {
							namespaces.set(nsId, `xmlns:${newNsAlias}`)

							return true
						}
					})
				}

				iconSvg.removeAttribute(attrName)
			}
		}

		rootSvg.appendChild(iconSvg)

		cb()
	}

	/**
	 * Flush function for the plugin.
	 *
	 * @param {function} cb - Callback function.
	 */
	function flush (cb) {
		if (isEmpty) {
			return cb()
		}

		for (let [nsId, nsAttr] of namespaces) {
			rootSvg.setAttribute(nsAttr, nsId)
		}

		const file = new Vinyl({ path: `stack.svg`, contents: Buffer.from(stack.toString()) })

		this.push(file)

		cb()
	}

	stream._transform = transform
	stream._flush = flush

	return stream
}

/**
 * Changes the namespace alias of an element and all its children.
 *
 * @param {Element} iconDom - Element to modify.
 * @param {string} oldAlias - Old namespace alias to replace.
 * @param {string} newAlias - New namespace alias.
 */
function changeNsAlias (iconDom, oldAlias, newAlias) {
	iconDom.querySelectorAll(`*`).forEach((elem) => {
		let prefix = newAlias === `` ? `` : `${newAlias}:`

		if (elem.rawTagName.startsWith(`${oldAlias}:`)) {
			elem.rawTagName = `${prefix}${elem.rawTagName.slice((oldAlias.length + 1))}`
		}

		for (let name of Object.keys(elem._attrs)) {
			if (name.startsWith(`${oldAlias}:`)) {
				elem.setAttribute(`${prefix}${name.slice((oldAlias.length + 1))}`, elem._attrs[name])
				elem.removeAttribute(name)
			}
		}
	})
}

/**
 * Get a hash for a given string.
 *
 * @param {string} str - String to hash.
 * @returns {string} Hash of the string.
 */
function getHash (str) {
	return createHmac(`sha1`, `xmlns`)
		.update(str)
		.digest(`hex`)
		.slice(0, 7)
}
