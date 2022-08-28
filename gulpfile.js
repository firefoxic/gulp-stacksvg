const stacksvg = require(`./index`)
const gulp = require(`gulp`)

function external () {
	return gulp
		.src(`test/src/icons/**/*.svg`)
		.pipe(stacksvg())
		.pipe(gulp.dest(`test/dest`))
}

exports.default = external
