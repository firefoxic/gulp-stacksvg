# gulp-stacksvg

<img align="right" width="130" height="175" title="SVG Superman" src="https://raw.githubusercontent.com/firefoxic/gulp-stacksvg/master/svg-superman.png">

[![Test Status][test-image]][test-url]
[![License: MIT][license-image]][license-url]
[![NPM version][npm-image]][npm-url]
[![Vulnerabilities count][vulnerabilities-image]][vulnerabilities-url]

Combine svg files into one with stack method.
Read more about this in [the Simurai article](https://simurai.com/blog/2012/04/02/svg-stacks).

## Installation

```shell
npm install gulp-stacksvg --save-dev
```

### Avalable options

| Option      | Description                                                                          | Default     |
|-------------|--------------------------------------------------------------------------------------|-------------|
| `output`    | Sets the stack file name. Accepts values ​​both with and without the `.svg` extension. | `stack.svg` |
| `separator` | Replaces the directory separator for the `id` attribute.                             | `_`         |
| `spacer`    | Joins space-separated words for the `id` attribute.                                  | `-`         |

## Usage

The following script will combine all svg sources into single svg file with stack method.

```js
import { stacksvg } from "gulp-stacksvg"
import gulp from "gulp"

const { src, dest } = gulp

function makeStack () {
	return src(`./src/icons/**/*.svg`)
		.pipe(stacksvg())
		.pipe(dest(`./dest/icons`))
}
```

### Inlining stacksvg result into markup

You just don't have to want it.

### Editing id attributes

If you need to add prefix to each id, please use [gulp-rename](https://github.com/hparra/gulp-rename):

```js
import { stacksvg } from "gulp-stacksvg"
import rename from "gulp-rename"
import gulp from "gulp"

const { src, dest } = gulp

function makeStack () {
	return src(`./src/icons/**/*.svg`, { base: `src/icons` })
		.pipe(rename({ prefix: `icon-` }))
		.pipe(stacksvg())
		.pipe(dest(`./dest/icons`))
}
```

### Transform svg sources or combined svg

To transform either svg sources or combined svg you may pipe your files through [gulp-cheerio](https://github.com/KenPowers/gulp-cheerio).

An example below removes all fill attributes from svg sources before combining them.
Please note that you have to set `xmlMode: true` to parse svgs as xml file.

```js
import { stacksvg } from "gulp-stacksvg"
import cheerio from "gulp-cheerio"
import gulp from "gulp"

const { src, dest } = gulp

function makeStack () {
	return src(`./src/icons/**/*.svg`)
		.pipe(cheerio({
			run: ($) => {
				$(`[fill]`).removeAttr(`fill`)
			},
			parserOptions: { xmlMode: true }
		}))
		.pipe(stacksvg())
		.pipe(dest(`./dest/icons`))
}
```

## Possible rendering issues with Clipping Paths in SVG

If you're running into issues with SVGs not rendering correctly in some browsers (see issue #47), the issue might be that clipping paths might not have been properly intersected in the SVG file. There are currently three ways of fixing this issue:

### Correcting the Clipping Path in the SVG

If you have the source file, simply converting the clipping path to a nice coded shape will fix this issue. Select the object, open up the Pathfinder panel, and click the Intersect icon.

### Editing the SVG Code

If you don't have the source file or an SVG Editor (Adobe Illustrator etc.), you can manually edit the SVG code in the file. Wrapping the `<clipPath>` into a `<defs>` will fix this issue. Here's an example:

```diff
<defs>
	<path d="M28.4 30.5l5.3 5c0-.1 7-6.9 7-6.9l-4-6.8-8.3 8.7z" id="a"/>
+	<clipPath id="b">
+		<use overflow="visible" href="#a"/>
+	</clipPath>
</defs>
-<clipPath id="b">
-	<use overflow="visible" xlink:href="#a"/>
-</clipPath>
```

Or you can go further and reduce the size by removing the `<use>` element, like this:

```diff
<defs>
-	<path d="M28.4 30.5l5.3 5c0-.1 7-6.9 7-6.9l-4-6.8-8.3 8.7z" id="a"/>
	<clipPath id="b">
-		<use overflow="visible" href="#a"/>
+		<path d="M28.4 30.5l5.3 5c0-.1 7-6.9 7-6.9l-4-6.8-8.3 8.7z"/>
	</clipPath>
</defs>
```

### Using gulp-cheerio to automate this

Another possible solution would be to write a transformation with [gulp-cheerio](https://github.com/KenPowers/gulp-cheerio). Check this issue <https://github.com/firefoxic/gulp-stacksvg/issues/98> for the instructions.

[test-url]: https://github.com/firefoxic/gulp-stacksvg/actions
[test-image]: https://github.com/firefoxic/gulp-stacksvg/actions/workflows/test.yml/badge.svg?branch=main

[npm-url]: https://npmjs.org/package/gulp-stacksvg
[npm-image]: https://badge.fury.io/js/gulp-stacksvg.svg

[license-url]: https://github.com/firefoxic/gulp-stacksvg/blob/main/LICENSE
[license-image]: https://img.shields.io/badge/License-MIT-limegreen.svg

[vulnerabilities-url]: https://snyk.io/test/github/firefoxic/gulp-stacksvg
[vulnerabilities-image]: https://snyk.io/test/github/firefoxic/gulp-stacksvg/badge.svg
