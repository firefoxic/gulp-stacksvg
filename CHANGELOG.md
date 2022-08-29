# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/firefoxic/gulp-stacksvg/compare/v1.0.0...HEAD
[v1.0.0]: https://github.com/firefoxic/gulp-stacksvg/releases/tag/v1.0.0
[v0.0.1]: https://github.com/firefoxic/gulp-stacksvg/releases/tag/v0.0.1
