import { stacksvg } from "./lib/index.js"
import gulp from "gulp"

const { src, dest } = gulp

export function createStack () {
	return src(`./docs/example/icons/**/*.svg`)
		.pipe(stacksvg())
		.pipe(dest(`./docs/example/`))
}
