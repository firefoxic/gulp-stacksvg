<!-- markdownlint-disable MD007 MD024 -->
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com), and this project adheres to [Semantic Versioning](https://semver.org).

## [Unreleased]

## [6.1.1] — 2026–08–07

### Fixed

- An icon already containing a name that the renaming itself produces, such as `icon_1` inside `icon.svg`, no longer has its references rewritten twice and left pointing at the wrong element.
- A reference made by the root `svg` element of an icon, such as `clip-path="url(#c)"`, is now rewritten together with the rest. Icons clipped or masked as a whole are no longer rendered unclipped in the stack.
- An icon whose inner identifiers are prefixes of one another, such as `a` and `ab`, no longer gets its references corrupted: `url(#ab)` used to be rewritten into a name that points nowhere. Such identifiers are common in the output of vector editors, so this could silently break any icon exported from one.
- An attribute holding several references to the same element, such as `style="fill:url(#a);mask:url(#a)"`, now has all of them rewritten instead of only the first one. Icons relying on this no longer lose their fills or masks once they are stacked.
- An icon sized in fractional units now keeps its proportions. The `viewBox` synthesized from `width` and `height` no longer loses the fractional part, so a `24.5`×`12.5` icon is no longer stretched to `245`×`125`. And an icon sized in context dependent units, such as `em` or `%`, now gets no synthesized `viewBox` at all instead of a meaningless one.

## [6.1.0] — 2026–07–11

### Added

- The package now provides type declarations.

## [6.0.0] — 2026–01–24

### Changed

- The plugin now requires:
	- `node.js` version `22.22.0` or higher,
	- `gulp` version `5.0.1` or higher (as peer dependency).

## [5.0.1] — 2024–11–01

### Fixed

- The deprecation warning for the `fs.Stats` constructor no longer litters the output in the terminal.

## [5.0.0] — 2024–10–30

### Changed

- The minimum required `node.js` version has been increased to `20.12.0`, except for version `21`.

## [4.0.0] — 2024–05–11

### Changed

- The plugin no longer accepts any options. Previously option defaults are now the only possible values:
	- subdirectory delimiter substitute — underscore;
	- space substitute — hyphen;
	- output file name — `stack.svg`.

## [3.0.0] — 2023–10–29

### Changed

- The required `node.js` to the latest maintained LTS versions.

## [2.0.3] — 2023–10–29

No significant changes.

## [2.0.2] — 2023–06–16

No significant changes.

## [2.0.1] — 2023–03–20

No significant changes.

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

## [1.1.0] — 2022–12–12

### Added

- Removing whitespace between tags when reading icon code. It will allow even well-optimized icons to be kept in source files in a readable form of formatted code.

## [1.0.6] — 2022–10–28

### Fixed

- Rendering in Safari.

## [1.0.5] — 2022–10–27

### Fixed

- Support `node@16`.

## [1.0.4] — 2022–09–22

No significant changes.

## [1.0.3] — 2022–09–04

### Fixed

- The unnecessary XML declaration is no longer added. Because it turns out that not only the DTD is not needed, but also the XML declaration, since the values ​​used are the default values. Stack works without all this XML prolog. More details can be found in [supplementary material](https://oreillymedia.github.io/Using_SVG/extras/ch01-XML.html) to the book “Using SVG with CSS3 and HTML5”.
- File existence check, which became unnecessary after the previous code optimization.

## [1.0.2] — 2022–09–01

### Fixed

- Different icons may contain the same identifiers. Previously, this was not taken into account in any way and could lead to erroneous rendering. This is now fixed, all identifiers on the stack are unique.

## [1.0.1] — 2022–08–29

### Fixed

- The contents of `defs` tags are no longer transferring to `defs` of the root element since there is no need for this.
- Optional namespace `xmlns:xlink` is now added only if it is necessary.
- The content of the icons does not turn into the `g` tag and the attributes remain on the `svg` tag, except deprecated and interfering.

## [1.0.0] — 2022–08–29

### Changed

- The project has been renamed to **gulp-stacksvg**.
- Changed sprite assembly method from _symbol_ to _stack_.
- Project converted to es-module.
- The ability to inline a sprite into markup has been removed.
- Missing `viewBoxes` are now created from icon sizes.

### Added

- `output`, `separator`, and `spacer` options.
- [LICENSE](./LICENSE.md) file.
- [CHANGELOG](./CHANGELOG.md) file.

## [0.0.1] — 2022–08–27

Just forked the [gulp-svgstore](https://github.com/w0rm/gulp-svgstore) project.

[Unreleased]: https://github.com/firefoxic/gulp-stacksvg/compare/v6.1.1...HEAD
[6.1.1]: https://github.com/firefoxic/gulp-stacksvg/compare/v6.1.0...v6.1.1
[6.1.0]: https://github.com/firefoxic/gulp-stacksvg/compare/v6.0.0...v6.1.0
[6.0.0]: https://github.com/firefoxic/gulp-stacksvg/compare/v5.0.1...v6.0.0
[5.0.1]: https://github.com/firefoxic/gulp-stacksvg/compare/v5.0.0...v5.0.1
[5.0.0]: https://github.com/firefoxic/gulp-stacksvg/compare/v4.0.0...v5.0.0
[4.0.0]: https://github.com/firefoxic/gulp-stacksvg/compare/v3.0.0...v4.0.0
[3.0.0]: https://github.com/firefoxic/gulp-stacksvg/compare/v2.0.3...v3.0.0
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
