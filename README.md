gulp-stacksvg ![Build Status](https://github.com/firefoxic/gulp-stacksvg/actions/workflows/test.yml/badge.svg?branch=main)
=============

<img align="right" width="130" height="175" title="SVG Superman" src="https://raw.githubusercontent.com/firefoxic/gulp-stacksvg/master/svg-superman.png">

Combine svg files into one with `<symbol>` elements.
Read more about this in [CSS Tricks article](http://css-tricks.com/svg-symbol-good-choice-icons/).

If you need similar plugin for grunt,
I encourage you to check [grunt-stacksvg](https://github.com/FWeinb/grunt-stacksvg).

### Options

The following options are set automatically based on file data:

* `id` attribute of the `<symbol>` element is set to the name of corresponding file;
* result filename is the name of base directory of the first file.

If your workflow is different, please use `gulp-rename` to rename sources or result.

## Install

```sh
npm install gulp-stacksvg --save-dev
```

## Usage

The following script will combine all svg sources into single svg file with `<symbol>` elements.
The name of result svg is the base directory name of the first file `src.svg`.

Additionally pass through [gulp-svgmin](https://github.com/ben-eb/gulp-svgmin)
to minify svg and ensure unique ids.

```js
const gulp = require(`gulp`)
const stacksvg = require(`gulp-stacksvg`)
const svgmin = require(`gulp-svgmin`)
const path = require(`path`)

function combineSVG () {
	return gulp.src(`test/src/*.svg`)
		.pipe(svgmin((file) => {
			const prefix = path.basename(file.relative, path.extname(file.relative))
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
		.pipe(gulp.dest(`test/dest`))
}
```

### Inlining stacksvg result into markup

You just don't have to want it.

### Generating id attributes

Id of symbol element is calculated from file name. You cannot pass files with the same name,
because id should be unique.

If you need to add prefix to each id, please use `gulp-rename`:

```js
const gulp = require(`gulp`)
const rename = require(`gulp-rename`)
const stacksvg = require(`gulp-stacksvg`)

function generateIdAttrs () {
	return gulp.src(`src/svg/**/*.svg`, { base: `src/svg` })
		.pipe(rename({prefix: `icon-`}))
		.pipe(stacksvg())
		.pipe(gulp.dest(`dest`))
}
```

If you need to have nested directories that may have files with the same name, please
use `gulp-rename`. The following example will concatenate relative path with the name of the file,
e.g. `src/svg/one/two/three/circle.svg` becomes `one-two-three-circle`.

```js
const gulp = require(`gulp`)
const path = require(`path`)
const rename = require(`gulp-rename`)
const stacksvg = require(`gulp-stacksvg`)

function generateIdAttrs () {
	return gulp.src(`src/svg/**/*.svg`, { base: `src/svg` })
		.pipe(rename((file) => {
			const name = file.dirname.split(path.sep)
			name.push(file.basename)
			file.basename = name.join(`-`)
		}))
		.pipe(stacksvg())
		.pipe(gulp.dest(`dest`))
}
```

## Transform svg sources or combined svg

To transform either svg sources or combined svg you may pipe your files through
[gulp-cheerio](https://github.com/KenPowers/gulp-cheerio).

### Transform svg sources

An example below removes all fill attributes from svg sources before combining them.
Please note that you have to set `xmlMode: true` to parse svgs as xml file.

```js
const gulp = require(`gulp`)
const stacksvg = require(`gulp-stacksvg`)
const cheerio = require(`gulp-cheerio`)

function transformSvgSources () {
	return gulp.src(`test/src/*.svg`)
		.pipe(cheerio({
			run: ($) => {
				$(`[fill]`).removeAttr(`fill`)
			},
			parserOptions: { xmlMode: true }
		}))
		.pipe(stacksvg())
		.pipe(gulp.dest(`test/dest`))
}
```

## Extracting metadata from combined svg

You can extract data with cheerio.

The following example extracts viewBox and id from each symbol in combined svg.

```js
const gulp = require(`gulp`)
const Vinyl = require(`vinyl`)
const stacksvg = require(`gulp-stacksvg`)
const through2 = require(`through2`)
const cheerio = require(`cheerio`)

function metadata () {
	return gulp.src(`test/src/*.svg`)
		.pipe(stacksvg())
		.pipe(through2.obj(function (file, encoding, cb) {
			const $ = cheerio.load(file.contents.toString(), {xmlMode: true})
			const data = $(`svg > symbol`).map(() => ({
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
		.pipe(gulp.dest(`test/dest`))
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
