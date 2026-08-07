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
function createTransform (processor: StackSvgCreator) {
	return function transform (file: Vinyl, _: BufferEncoding, cb: (error?: Error | null) => void): void {
		if (file.isStream()) return cb(new PluginError(`gulp-stacksvg`, `Streams are not supported!`))

		if (!file.isBuffer()) return cb()

		try {
			processor.add(file.contents.toString(), file.relative)
		}
		catch (error) {
			return cb(new PluginError(`gulp-stacksvg`, (error as Error).message))
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
function createFlush (processor: StackSvgCreator, stream: Transform) {
	return function flush (cb: (error?: Error | null) => void): void {
		let stackSprite = processor.getStackSprite()

		if (!stackSprite) return cb()

		let file = new Vinyl({ path: `stack.svg`, contents: Buffer.from(stackSprite) })

		stream.push(file)

		cb()
	}
}

export function stacksvg (): Transform {
	let processor = new StackSvgCreator()
	let stream = new Transform({ objectMode: true })

	stream._transform = createTransform(processor)
	stream._flush = createFlush(processor, stream)

	return stream
}
