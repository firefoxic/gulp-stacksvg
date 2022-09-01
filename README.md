# gulp-stacksvg

[![Test Status][test-image]][test-url]
[![License: MIT][license-image]][license-url]
[![NPM version][npm-image]][npm-url]
[![Vulnerabilities count][vulnerabilities-image]][vulnerabilities-url]

Combine svg icon files into one with stack method.

## Installation

```shell
npm install gulp-stacksvg --save-dev
```

## Usage

The following script will combine all svg sources into single svg file with stack method.

```js
import { stacksvg } from "gulp-stacksvg"
import gulp from "gulp"

const { src, dest } = gulp

function makeStack () {
	return src(`./src/icons/**/*.svg`)
		.pipe(stacksvg({ output: `sprite` }))
		.pipe(dest(`./dest/icons`))
}
```

### Avalable options

| Option      | Description                                                                          | Default     |
|-------------|--------------------------------------------------------------------------------------|-------------|
| `output`    | Sets the stack file name. Accepts values ​both with and without the `.svg` extension. | `stack.svg` |
| `separator` | Replaces the directory separator for the `id` attribute.                             | `_`         |
| `spacer`    | Joins space-separated words for the `id` attribute.                                  | `-`         |

### Inlining stacksvg result into markup

You just don't have to want it.

[test-url]: https://github.com/firefoxic/gulp-stacksvg/actions
[test-image]: https://github.com/firefoxic/gulp-stacksvg/actions/workflows/test.yml/badge.svg?branch=main

[npm-url]: https://npmjs.org/package/gulp-stacksvg
[npm-image]: https://badge.fury.io/js/gulp-stacksvg.svg

[license-url]: https://github.com/firefoxic/gulp-stacksvg/blob/main/LICENSE
[license-image]: https://img.shields.io/badge/License-MIT-limegreen.svg

[vulnerabilities-url]: https://snyk.io/test/github/firefoxic/gulp-stacksvg
[vulnerabilities-image]: https://snyk.io/test/github/firefoxic/gulp-stacksvg/badge.svg
