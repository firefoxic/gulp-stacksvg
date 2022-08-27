const stacksvg = require(`./index`)
const gulp = require(`gulp`)
const inject = require(`gulp-inject`)

function external () {
	return gulp
		.src(`test/src/*.svg`)
		.pipe(stacksvg())
		.pipe(gulp.dest(`test/dest`))
}

function inline () {
	function fileContents(_, file) {
		return file.contents.toString(`utf8`)
	}

	const svgs = gulp.src(`test/src/*.svg`)
		.pipe(stacksvg({ inlineSvg: true }))

	return gulp.src(`test/src/inline-svg.html`)
		.pipe(inject(svgs, { transform: fileContents }))
		.pipe(gulp.dest(`test/dest`))
}

exports.default = (done) => {
	gulp.series([external, inline])(done)
}
