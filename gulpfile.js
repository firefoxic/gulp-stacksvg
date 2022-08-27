const stacksvg = require('./index')
const gulp = require('gulp')
const inject = require('gulp-inject')

gulp.task('external', () =>
  gulp
    .src('test/src/*.svg')
    .pipe(stacksvg())
    .pipe(gulp.dest('test/dest'))
)

gulp.task('inline', () => {
  function fileContents (_, file) {
    return file.contents.toString('utf8')
  }

  const svgs = gulp
    .src('test/src/*.svg')
    .pipe(stacksvg({ inlineSvg: true }))

  return gulp
    .src('test/src/inline-svg.html')
    .pipe(inject(svgs, { transform: fileContents }))
    .pipe(gulp.dest('test/dest'))
})

gulp.task('build', gulp.series(['external', 'inline']))
