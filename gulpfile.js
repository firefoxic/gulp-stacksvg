import { src, dest } from "gulp"

import { stacksvg } from "./lib/index.js"

export function createStack () {
	return src(`./docs/example/icons/**/*.svg`)
		.pipe(stacksvg())
		.pipe(dest(`./docs/example/`))
}
