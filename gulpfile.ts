import { dest, src } from "gulp"

import { stacksvg } from "./src/index.ts"

export function createStack (): NodeJS.ReadWriteStream {
	return src(`./docs/example/icons/**/*.svg`)
		.pipe(stacksvg())
		.pipe(dest(`./docs/example/`))
}
