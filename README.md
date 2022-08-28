gulp-stacksvg ![Build Status](https://github.com/firefoxic/gulp-stacksvg/actions/workflows/test.yml/badge.svg?branch=main)
=============

<img align="right" width="130" height="175" title="SVG Superman" src="https://raw.githubusercontent.com/firefoxic/gulp-stacksvg/master/svg-superman.png">

Combine svg files into one with stack method.
Read more about this in [the Simurai article](https://simurai.com/blog/2012/04/02/svg-stacks).

### Options

The `id` attribute of the stack fragment is set to the name of the corresponding file automatically.

The `output` option sets the stack file name. The default value is `stack.svg`. You can pass to this option either a name with the `.svg` extension or without it.

## Install

```sh
npm install gulp-stacksvg --save-dev
```

## Usage

The following script will combine all svg sources into single svg file with stack method.
The name of result svg is the base directory name of the first file `src.svg`.

Additionally pass through [gulp-svgmin](https://github.com/ben-eb/gulp-svgmin)
to minify svg and ensure unique ids.

```js
import { stacksvg } from "gulp-stacksvg"
import { basename, extname } from "path"
import svgmin from "gulp-svgmin"
import gulp from "gulp"

const { src, dest } = gulp

function combineSVG () {
	return src(`test/src/*.svg`)
		.pipe(svgmin((file) => {
			const prefix = basename(file.relative, extname(file.relative))
			return {
				plugins: [{
					cleanupIDs: {
						prefix: `${prefix }-`,
						minify: true
					}
				}]
			}
		}))
		.pipe(stacksvg())
		.pipe(dest(`test/dest`))
}
```

### Inlining stacksvg result into markup

You just don't have to want it.

### Generating id attributes

Id of the stack fragment is calculated from file name. You cannot pass files with the same name,
because id should be unique.

If you need to add prefix to each id, please use `gulp-rename`:

```js
import { stacksvg } from "gulp-stacksvg"
import rename from "gulp-rename"
import gulp from "gulp"

const { src, dest } = gulp

function generateIdAttrs () {
	return src(`src/svg/**/*.svg`, { base: `src/svg` })
		.pipe(rename({prefix: `icon-`}))
		.pipe(stacksvg())
		.pipe(dest(`dest`))
}
```

If you need to have nested directories that may have files with the same name, please
use `gulp-rename`. The following example will concatenate relative path with the name of the file,
e.g. `src/svg/one/two/three/circle.svg` becomes `one-two-three-circle`.

```js
import { stacksvg } from "gulp-stacksvg"
import { sep } from "path"
import rename from "gulp-rename"
import gulp from "gulp"

const { src, dest } = gulp

function generateIdAttrs () {
	return src(`src/svg/**/*.svg`, { base: `src/svg` })
		.pipe(rename((file) => {
			const name = file.dirname.split(sep)
			name.push(file.basename)
			file.basename = name.join(`-`)
		}))
		.pipe(stacksvg())
		.pipe(dest(`dest`))
}
```

## Transform svg sources or combined svg

To transform either svg sources or combined svg you may pipe your files through
[gulp-cheerio](https://github.com/KenPowers/gulp-cheerio).

### Transform svg sources

An example below removes all fill attributes from svg sources before combining them.
Please note that you have to set `xmlMode: true` to parse svgs as xml file.

```js
import { stacksvg } from "gulp-stacksvg"
import cheerio from "gulp-cheerio"
import gulp from "gulp"

const { src, dest } = gulp

function transformSvgSources () {
	return src(`test/src/*.svg`)
		.pipe(cheerio({
			run: ($) => {
				$(`[fill]`).removeAttr(`fill`)
			},
			parserOptions: { xmlMode: true }
		}))
		.pipe(stacksvg())
		.pipe(dest(`test/dest`))
}
```

## Extracting metadata from combined svg

You can extract data with cheerio.

The following example extracts viewBox and id from each stack fragment.

```js
import { stacksvg } from "gulp-stacksvg"
import { obj } from "through2"
import { load } from "cheerio"
import Vinyl from "vinyl"
import gulp from "gulp"

const { src, dest } = gulp

function metadata () {
	return src(`test/src/*.svg`)
		.pipe(stacksvg())
		.pipe(obj(function (file, encoding, cb) {
			const $ = load(file.contents.toString(), {xmlMode: true})
			const data = $(`svg > svg`).map(() => ({
				name: $(this).attr(`id`),
				viewBox: $(this).attr(`viewBox`)
			})).get()
			const jsonFile = new Vinyl({
				path: `metadata.json`,
				contents: Buffer.from(JSON.stringify(data))
			})
			this.push(jsonFile)
			this.push(file)
			cb()
		}))
		.pipe(dest(`test/dest`))
}
```

## Possible rendering issues with Clipping Paths in SVG

If you're running into issues with SVGs not rendering correctly in some browsers (see issue #47), the issue might be that clipping paths might not have been properly intersected in the SVG file. There are currently three ways of fixing this issue:

### Correcting the Clipping Path in the SVG

If you have the source file, simply converting the clipping path to a nice coded shape will fix this issue. Select the object, open up the Pathfinder panel, and click the Intersect icon.

### Editing the SVG Code

If you don't have the source file or an SVG Editor (Adobe Illustrator etc.), you can manually edit the SVG code in the file. Wrapping the `<clipPath>` into a `<defs>` will fix this issue. Here's an example:

```
<defs>
	<path d="M28.4 30.5l5.3 5c0-.1 7-6.9 7-6.9l-4-6.8-8.3 8.7z" id="a"/>
</defs>
<clipPath id="b"><use overflow="visible" xlink:href="#a"/></clipPath>
```

Becomes:

```
<defs>
	<path d="M28.4 30.5l5.3 5c0-.1 7-6.9 7-6.9l-4-6.8-8.3 8.7z" id="a"/>
	<clipPath id="b"><use overflow="visible" xlink:href="#a"/></clipPath>
</defs>
```

Or you can go further and reduce the size by removing the `<use>` element, like this:

```
<defs>
	<clipPath id="b"><path d="M28.4 30.5l5.3 5c0-.1 7-6.9 7-6.9l-4-6.8-8.3 8.7z"/></clipPath>
</defs>
```

### Using gulp-cheerio to automate this

Another possible solution would be to write a transformation with [gulp-cheerio](https://github.com/KenPowers/gulp-cheerio). Check this issue <https://github.com/firefoxic/gulp-stacksvg/issues/98> for the instructions.
