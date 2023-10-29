<!-- markdownlint-disable MD007 MD024 -->
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.0.3] — 2023–10–29

### Updated

- Dependencies.

## [2.0.2] — 2023–06–16

### Added

- The jsDoc comments.

### Updated

- This document.

## [2.0.1] — 2023–03–20

### Changed

- No user-visible changes.

## [2.0.0] — 2022–12–21

### Changed

- Improved namespace processing:
	- Namespace values are now checked for uniqueness, since they are essential.
	- Different aliases of the same namespace are now cast to the same name.
	- The declaration of the deprecated namespace `http://www.w3.org/1999/xlink` and its aliases in `href` attribute prefixes are now removed.
	- Duplicate aliases of different namespaces are now renamed.
	- Declarations of only used namespaces are now added to the root `svg` element.
	- Namespace processing takes into account aliases for both attributes and tag names.
	- The main namespace `xmlns="http://www.w3.org/2000/svg"` has been moved to the map object.

### Fixed

- Removed the deprecated `xlink` namespace from [Readme](README.md#stack-under-the-hood).

## [1.1.0] — 2022–12–12

### Added

- Removing whitespace between tags when reading icon code. It will allow even well-optimized icons to be kept in source files in a readable form of formatted code.
- Useful links section to [Readme](README.md#useful-links).

## [1.0.6] — 2022–10–28

### Fixed

- Rendering in Safari.

## [1.0.5] — 2022–10–27

### Fixed

- Support node@16+.

## [1.0.4] — 2022–09–22

### Changed

- No user-visible changes.

## [1.0.3] — 2022–09–04

### Removed

- Unnecessary XML declaration. Because it turns out that not only the DTD is not needed, but also the XML declaration, since the values ​​used are the default values. Stack works without all this XML prolog. More details can be found in [supplementary material](https://oreillymedia.github.io/Using_SVG/extras/ch01-XML.html) to the book “Using SVG with CSS3 and HTML5”.
- File existence check, which became unnecessary after the previous code optimization.

### Added

- Link to [autoprefixer](https://github.com/postcss/autoprefixer).

## [1.0.2] — 2022–09–01

### Fixed

- Different icons may contain the same identifiers. Previously, this was not taken into account in any way and could lead to erroneous rendering. This is now fixed, all identifiers on the stack are unique.

### Added

- [Demo page](https://firefoxic.github.io/gulp-stacksvg/test/).
- Explanations to the Readme.

### Removed

- SVG Superman from the Readme.
- Unnecessary text from the Readme.

## [1.0.1] — 2022–08–29

### Changed

- The contents of `defs` tags are no longer transferring to `defs` of the root element since there is no need for this.
- Optional namespace `xmlns:xlink` is now added only if it is necessary.
- The content of the icons does not turn into the `g` tag and the attributes remain on the `svg` tag, except deprecated and interfering.

## [1.0.0] — 2022–08–29

### Changed

- The project has been renamed to **gulp-stacksvg**.
- Changed sprite assembly method from _symbol_ to _stack_.
- Project converted to es-module.

### Removed

- The ability to inline a sprite into markup.

### Added

- Creation of skipped `viewBox` from icon sizes.
- `output`, `separator`, and `spacer` [options](./README.md#available-options).
- [LICENSE](./LICENSE) file.
- [CHANGELOG](./CHANGELOG.md) file.
- [EditorConfig](./.editorconfig) file.
- Badges into [README](./README.md) file.

## [0.0.1] — 2022–08–27

Just forked the [gulp-svgstore](https://github.com/w0rm/gulp-svgstore) project.

[Unreleased]: https://github.com/firefoxic/gulp-stacksvg/compare/v2.0.3...HEAD
[2.0.3]: https://github.com/firefoxic/gulp-stacksvg/compare/v2.0.2...v2.0.3
[2.0.2]: https://github.com/firefoxic/gulp-stacksvg/compare/v2.0.1...v2.0.2
[2.0.1]: https://github.com/firefoxic/gulp-stacksvg/compare/v2.0.0...v2.0.1
[2.0.0]: https://github.com/firefoxic/gulp-stacksvg/compare/v1.1.0...v2.0.0
[1.1.0]: https://github.com/firefoxic/gulp-stacksvg/compare/v1.0.6...v1.1.0
[1.0.6]: https://github.com/firefoxic/gulp-stacksvg/compare/v1.0.5...v1.0.6
[1.0.5]: https://github.com/firefoxic/gulp-stacksvg/compare/v1.0.4...v1.0.5
[1.0.4]: https://github.com/firefoxic/gulp-stacksvg/compare/v1.0.3...v1.0.4
[1.0.3]: https://github.com/firefoxic/gulp-stacksvg/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/firefoxic/gulp-stacksvg/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/firefoxic/gulp-stacksvg/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/firefoxic/gulp-stacksvg/compare/v0.0.1...v1.0.0
[0.0.1]: https://github.com/firefoxic/gulp-stacksvg/releases/tag/v0.0.1
