import { Transform } from "node:stream"

import PluginError from "plugin-error"
import Vinyl from "vinyl"

import { StackSvgCreator } from "./svg-processor.js"

/**
 * Create transform function for the plugin.
 *
 * @param {StackSvgCreator} processor - StackSvgCreator instance.
 * @returns {function} Transform function.
 */
function createTransform (processor) {
	/**
	 * Transform function for the plugin.
	 *
	 * @param {Vinyl} file - Gulp file object.
	 * @param {string} [_] - Encoding to use when writing the file.
	 * @param {function} cb - Callback function.
	 * @returns {void}
	 */
	return function transform (file, _, cb) {
		if (file.isStream()) return cb(new PluginError(`gulp-stacksvg`, `Streams are not supported!`))

		if (file.isNull()) return cb()

		let content = file.contents.toString()

		try {
			processor.add(content, file.relative)
		}
		catch (error) {
			return cb(new PluginError(`gulp-stacksvg`, error.message))
		}

		cb()
	}
}

/**
 * Create flush function for the plugin.
 *
 * @param {StackSvgCreator} processor - StackSvgCreator instance.
 * @param {Transform} stream - Gulp transform stream.
 * @returns {function} Flush function.
 */
function createFlush (processor, stream) {
	/**
	 * Flush function for the plugin.
	 *
	 * @param {function} cb - Callback function.
	 * @returns {void}
	 */
	return function flush (cb) {
		let stackSprite = processor.getStackSprite()

		if (!stackSprite) return cb()

		let file = new Vinyl({ path: `stack.svg`, contents: Buffer.from(stackSprite) })

		stream.push(file)

		cb()
	}
}

/**
 * Gulp plugin for combining SVG icons into a single file.
 *
 * @exports {function} stacksvg - Gulp plugin.
 * @returns {Transform} Gulp transform stream.
 */
export function stacksvg () {
	let processor = new StackSvgCreator()
	let stream = new Transform({ objectMode: true })

	stream._transform = createTransform(processor)
	stream._flush = createFlush(processor, stream)

	return stream
}
