import { createHmac } from "node:crypto"
import path from "node:path"

import { type HTMLElement, parse } from "node-html-parser"

let excessAttrs = [
	`enable-background`,
	`height`,
	`version`,
	`width`,
	`x`,
	`xml:space`,
	`y`,
]

const XLINK = `http://www.w3.org/1999/xlink`

/**
 * Get a hash for a given string.
 *
 * @param {string} str - String to hash.
 * @returns {string} Hash of the string.
 */
function getHash (str: string): string {
	return createHmac(`sha1`, `xmlns`)
		.update(str)
		.digest(`hex`)
		.slice(0, 7)
}

/**
 * Escape a string so that it matches itself literally inside a regular expression.
 *
 * @param {string} str - String to escape.
 * @returns {string} Escaped string.
 */
function escapeRegExp (str: string): string {
	return str.replaceAll(/[.*+?^${}()|[\]\\]/gu, `\\$&`)
}

/**
 * Build a pattern matching the references to any of the given ids.
 *
 * The lookahead keeps `#a` from matching inside `#ab`: a reference ends where the name does, so any character that can continue an xml name means a different id.
 *
 * @param {string[]} ids - Ids to match the references to.
 * @returns {RegExp} Pattern capturing the id of every reference to any of them.
 */
function getReferencePattern (ids: string[]): RegExp {
	let names = ids.map((id) => escapeRegExp(id)).join(`|`)

	return new RegExp(`#(${names})(?![\\p{L}\\p{N}._:-])`, `gu`)
}

/**
 * Parse a length expressed in user units.
 *
 * Only unitless values and pixels map onto the user coordinate system that the `viewBox` describes. Anything else (`em`, `%`, …) resolves against the rendering context and cannot be turned into a `viewBox` ahead of time.
 *
 * @param {string|undefined} value - Attribute value to parse.
 * @returns {string|null} The length in user units, or null if it is not one.
 */
function parseUserUnits (value: string | undefined): string | null {
	return (/^\s*(?<length>\d*\.?\d+)(?:px)?\s*$/u).exec(value ?? ``)?.groups?.length ?? null
}

/**
 * Changes the namespace alias of an element and all its children.
 *
 * @param {Element} iconDom - Element to modify.
 * @param {string} oldAlias - Old namespace alias to replace.
 * @param {string} newAlias - New namespace alias.
 */
function changeNsAlias (iconDom: HTMLElement, oldAlias: string, newAlias: string): void {
	for (let elem of iconDom.querySelectorAll(`*`)) {
		let prefix = newAlias === `` ? `` : `${newAlias}:`

		if (elem.rawTagName.startsWith(`${oldAlias}:`)) elem.rawTagName = `${prefix}${elem.rawTagName.slice((oldAlias.length + 1))}`

		for (let name of Object.keys(elem.attrs)) {
			if (name.startsWith(`${oldAlias}:`)) {
				elem.setAttribute(`${prefix}${name.slice((oldAlias.length + 1))}`, elem.attrs[name])
				elem.removeAttribute(name)
			}
		}
	}
}

/**
 * SVG processor for combining icons into a stack sprite.
 */
export class StackSvgCreator {
	public isEmpty: boolean

	public ids: Record<string, boolean>

	public namespaces: Map<string, string>

	public stack: HTMLElement

	public rootSvg: HTMLElement

	/**
	 * Prefix the id of every identified element with the icon id, so that icons sharing a name for their inner parts stay independent once stacked.
	 *
	 * The renaming happens in two passes. Rewriting a reference right after each rename would let a later rename catch the result of an earlier one, whenever an icon already contains a name the renaming itself produces.
	 *
	 * @param {Element} iconSvg - Root SVG element of the icon.
	 * @param {string} iconId - Icon id to use as prefix.
	 */
	static #changeInnerIds (iconSvg: HTMLElement, iconId: string): void {
		let renames = new Map<string, string>()

		for (let [i, elem] of iconSvg.querySelectorAll(`[id]`).entries()) {
			let newId = `${iconId}_${i}`

			renames.set(elem.id, newId)
			elem.setAttribute(`id`, newId)
		}

		if (renames.size === 0) return

		let pattern = getReferencePattern([...renames.keys()])

		for (let elem of [iconSvg, ...iconSvg.querySelectorAll(`*`)]) {
			if (elem.rawAttrs.search(pattern) === -1) continue

			for (let [attr, value] of Object.entries(elem.attrs)) {
				elem.setAttribute(attr, value.replaceAll(pattern, (reference, oldId) => `#${renames.get(oldId) ?? oldId}`))
			}
		}
	}

	/**
	 * Create SVG processor.
	 */
	public constructor () {
		this.isEmpty = true
		this.ids = {}
		this.namespaces = new Map([[`http://www.w3.org/2000/svg`, `xmlns`]])
		this.stack = parse(`<svg><style>:root svg:not(:target){display:none}</style></svg>`)
		this.rootSvg = this.stack.querySelector(`svg`) ?? parse(`<svg/>`)
	}

	/**
	 * Add an SVG file to the stack sprite.
	 *
	 * @param {string} content - SVG file content.
	 * @param {string} relativePath - Relative path of the file.
	 * @returns {boolean} True if added successfully, false if skipped.
	 */
	public add (content: string, relativePath: string): boolean {
		let iconDom = parse(content).removeWhitespace()
		let iconSvg = iconDom.querySelector(`svg`)

		if (!iconSvg) return false

		this.isEmpty = false

		let iconId = path.basename(
			relativePath.split(path.sep).join(`_`).replaceAll(/\s/gu, `-`),
			path.extname(relativePath),
		)

		if (iconId in this.ids) throw new Error(`File name should be unique: ${iconId}`)

		this.ids[iconId] = true
		iconSvg.setAttribute(`id`, iconId)

		let viewBoxAttr = iconSvg.getAttribute(`viewBox`)
		let widthAttr = parseUserUnits(iconSvg.getAttribute(`width`))
		let heightAttr = parseUserUnits(iconSvg.getAttribute(`height`))

		if (!viewBoxAttr && widthAttr && heightAttr) iconSvg.setAttribute(`viewBox`, `0 0 ${widthAttr} ${heightAttr}`)

		for (let attr of excessAttrs) iconSvg.removeAttribute(attr)

		StackSvgCreator.#changeInnerIds(iconSvg, iconId)

		this.#processNamespaces(iconDom, iconSvg)

		this.rootSvg.append(iconSvg)

		return true
	}

	/**
	 * Get the final stack sprite content.
	 *
	 * @returns {string|null} Stack sprite content or null if empty.
	 */
	public getStackSprite (): string | null {
		if (this.isEmpty) return null

		for (let [nsId, nsAttr] of this.namespaces) this.rootSvg.setAttribute(nsAttr, nsId)

		return this.stack.toString()
	}

	/**
	 * Process namespaces in the icon.
	 *
	 * @param {Element} iconDom - Icon DOM root.
	 * @param {Element} iconSvg - Icon SVG element.
	 */
	#processNamespaces (iconDom: HTMLElement, iconSvg: HTMLElement): void {
		let attrs = iconSvg.attrs

		for (let attrName in attrs) {
			if (!attrName.startsWith(`xmlns`)) continue

			let nsId = attrs[attrName]
			let oldNsAlias = attrName.slice(6)
			let newNsAlias = oldNsAlias

			let registeredNsAttr = this.namespaces.get(nsId)

			if (registeredNsAttr && registeredNsAttr !== attrName) {
				newNsAlias = registeredNsAttr.slice(6)
				changeNsAlias(iconDom, oldNsAlias, newNsAlias)
			}
			else if (nsId === XLINK) {
				newNsAlias = ``
				changeNsAlias(iconDom, oldNsAlias, newNsAlias)
			}
			else {
				for (let ns of this.namespaces.values()) {
					if (ns !== attrName) continue

					newNsAlias = `${oldNsAlias}${getHash(nsId)}`
					changeNsAlias(iconDom, oldNsAlias, newNsAlias)
					break
				}

				let hasNsUsage = iconDom.querySelectorAll(`*`).some((elem) => {
					if (
						elem.rawTagName.startsWith(`${newNsAlias}:`)
						|| Object.keys(elem.attrs).some((attr) => attr.startsWith(`${newNsAlias}:`))
					) return true

					return false
				})

				if (hasNsUsage) this.namespaces.set(nsId, `xmlns:${newNsAlias}`)
			}

			iconSvg.removeAttribute(attrName)
		}
	}
}
