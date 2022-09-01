import { stacksvg } from "./index.js"
import gulp from "gulp"

const { src, dest } = gulp

export function test () {
	return src([`test/src/icons/**/*.svg`, `!test/src/icons/**/*-*.svg`])
		.pipe(stacksvg())
		.pipe(dest(`test/dest`))
}
