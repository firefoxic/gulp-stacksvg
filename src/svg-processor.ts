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
	 * Update the id of a child element if it has the same id.
	 *
	 * @param {Element} targetElem - Child element to update.
	 * @param {string} suffix - Suffix to append to the id.
	 * @param {Element} iconSvg - Root SVG element.
	 * @param {string} iconId - Icon ID to use as prefix.
	 */
	static #changeInnerId (targetElem: HTMLElement, suffix: number, iconSvg: HTMLElement, iconId: string): void {
		let oldId = targetElem.id
		let newId = `${iconId}_${suffix}`

		targetElem.setAttribute(`id`, newId)
		for (let element of iconSvg.querySelectorAll(`*`)) StackSvgCreator.#updateUsingId(element, oldId, newId)
	}

	/**
	 * Update references to the old id with the new id.
	 *
	 * @param {Element} elem - Element to update.
	 * @param {string} oldId - Old id.
	 * @param {string} newId - New id.
	 */
	static #updateUsingId (elem: HTMLElement, oldId: string, newId: string): void {
		if (elem.rawAttrs.search(`#${oldId}`) === -1) return

		for (let attr in elem.attrs) {
			if (!Object.hasOwn(elem.attrs, attr)) continue

			let attrValue = elem.attrs[attr].replace(`#${oldId}`, `#${newId}`)
			elem.setAttribute(attr, attrValue)
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
		let widthAttr = iconSvg.getAttribute(`width`)?.replaceAll(/[^0-9]/gu, ``)
		let heightAttr = iconSvg.getAttribute(`height`)?.replaceAll(/[^0-9]/gu, ``)

		if (!viewBoxAttr && widthAttr && heightAttr) iconSvg.setAttribute(`viewBox`, `0 0 ${widthAttr} ${heightAttr}`)

		for (let attr of excessAttrs) iconSvg.removeAttribute(attr)
		for (let [i, elem] of iconSvg.querySelectorAll(`[id]`).entries()) StackSvgCreator.#changeInnerId(elem, i, iconSvg, iconId)

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

			if (this.namespaces.has(nsId) && this.namespaces.get(nsId) !== attrName) {
				newNsAlias = (this.namespaces.get(nsId) ?? ``).slice(6)
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
