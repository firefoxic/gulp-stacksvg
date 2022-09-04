# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Link to [autoprefixer](https://github.com/postcss/autoprefixer).

## [v1.0.2] — 2022–09–01

### Fixed

- Different icons may contain the same identifiers. Previously, this was not taken into account in any way and could lead to erroneous rendering. This is now fixed, all identifiers on the stack are unique.

### Added

- [Demo page](https://firefoxic.github.io/gulp-stacksvg/test/).
- Explanations to the Readme.

### Changed

- [`cheerio`](https://www.npmjs.com/package/cheerio) replaced with [`node-html-parser`](https://www.npmjs.com/package/node-html-parser).
- Test icons set.

### Removed

- SVG Superman from the Readme.
- Unnecessary text from the Readme.

## [v1.0.1] — 2022–08–29

### Changed

- The contents of `defs` tags are no longer transferring to `defs` of the root element, since there is no need for this.
- Optional namespace `xmlns:xlink` is now added only if it is necessary.
- The content of the icons does not turn into the `g` tag and the attributes remain on the `svg` tag, except deprecated and interfering.
- Slightly improved code readability.

## [v1.0.0] — 2022–08–29

### Changed

- The project has been renamed to **gulp-stacksvg**.
- Changed sprite assembly method from _symbol_ to _stack_.
- Project converted to es-module.
- The stack is checked when working from both markup and styles.
- Completely reorganized test files.
- Replaced jshint with eslint.

### Removed

- The ability to inline a sprite into markup.

### Added

- Creation of skipped viewBox from icon sizes.
- `output`, `separator` and `spacer` [options](./README.md#avalable-options).
- `npm` scripts for a better workflow.
- [LICENSE](./LICENSE) file.
- [CHANGELOG](./CHANGELOG.md) file.
- [EditorConfig](./.editorconfig) file.
- Badges into [README](./README.md) file.

### Updated

- All dependencies.
- Test action.

## [v0.0.1] — 2022–08–27

Just forked the [gulp-svgstore](https://github.com/w0rm/gulp-svgstore) project.

[Unreleased]: https://github.com/firefoxic/gulp-stacksvg/compare/v1.0.2...HEAD
[v1.0.2]: https://github.com/firefoxic/gulp-stacksvg/releases/tag/v1.0.2
[v1.0.1]: https://github.com/firefoxic/gulp-stacksvg/releases/tag/v1.0.1
[v1.0.0]: https://github.com/firefoxic/gulp-stacksvg/releases/tag/v1.0.0
[v0.0.1]: https://github.com/firefoxic/gulp-stacksvg/releases/tag/v0.0.1
