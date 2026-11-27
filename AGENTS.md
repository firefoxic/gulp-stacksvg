# AGENTS.md

This file provides guidance to coding agents when working with code in this repository.

## Commands

All tasks go through the `Makefile` (targets add `node_modules/.bin` to `PATH`, so no `pnpm exec` prefix is needed):

| Command | Effect |
| --- | --- |
| `make setup` | Check that pnpm is on `PATH`, `pnpm ci`, point `core.hooksPath` at `.githooks` |
| `make check` | `tsc --noEmit` |
| `make lint` / `make fix` | `oxlint` / `oxlint --fix` |
| `make test` | `vitest run --project unit` — the fast loop, no build needed |
| `make watch` | The same suite in watch mode |
| `make coverage` | Unit suite with a v8 coverage report over `src/` |
| `make build` | Runs `check` + `lint`, then bundles with `tsdown` into `dist/` |
| `make test-package` | Runs `build` first, then `vitest run --project package` |
| `make verify` | `check` + `lint` + `test` + `test-package` — the full gate, what CI and the pre-commit hook run |
| `make release` | Runs `verify`, then `pnpm dlx @firefoxic/release-it` |

Two vitest projects, split by what they import (see [vitest.config.js](vitest.config.js)):

- **`unit`** — [test/unit/](test/unit/) imports `../../src/index.js`, which vitest resolves to the TypeScript source. This is where behaviour is covered, and it needs no build step.
- **`package`** — [test/package/smoke.ts](test/package/smoke.ts) imports `../../src/index.ts`. It proves the plugin works end to end against the TypeScript source directly, with no build step: type stripping runs the `.ts` files as-is. Keep it thin — behavioural assertions belong in `unit`.

Single test: `vitest run --project unit -t "part of the test name"`.

Manual smoke check: `make smoke` runs `gulp createStack` directly against the TypeScript source (no build needed) and regenerates [docs/example/stack.svg](docs/example/stack.svg) from [docs/example/icons/](docs/example/icons).

The pre-commit hook stashes unstaged work and runs `make verify` when any `.js`/`.ts` file is staged.

## Architecture

This is a thin gulp (Vinyl) wrapper around the standalone engine [`@firefoxic/stacksvg`](https://github.com/firefoxic/stacksvg). All SVG logic — id derivation, inner-id rewriting, namespace reconciliation, `viewBox` synthesis, serialization — lives in that package and is tested there. This repository keeps only the plugin layer.

- [src/index.ts](src/index.ts) — the entire plugin. `stacksvg()` builds a `node:stream` `Transform` in object mode and assigns `_transform` / `_flush`. `_transform` skips null files, rejects streamed files, and feeds buffer contents to a `StackSvgCreator` from `@firefoxic/stacksvg` (one `add()` per file, with `file.relative` as the fragment path); thrown processor errors become `PluginError`s. `_flush` asks the processor for the sprite and pushes a single `Vinyl` named `stack.svg` — or nothing at all if no valid SVG was seen.

The processor is consumed incrementally (`add()` per file, `getStackSprite()` at flush) rather than through the one-shot `stacksvg(sources)` helper, because gulp delivers files one at a time.

## Conventions

- Backtick template literals for all string literals, including plain ones (`` `stack.svg` ``, not `"stack.svg"`). Import specifiers stay double-quoted.
- Tabs, no semicolons, `let` over `const`, space before function parameter parens (`function transform (…)`).
- `isolatedDeclarations: true` — every exported binding needs an explicit type annotation; `exactOptionalPropertyTypes` is on too.
- JSDoc blocks on exported and private methods, even in TypeScript.
- Tests are plain `.js` under `test/` and assert on exact serialized sprite strings, so any output change (attribute order, whitespace, self-closing form) requires updating those literals. The serialization format is owned by `@firefoxic/stacksvg` — empty elements are self-closing — so a bump of that dependency may change the literals here.

## Changelog

[CHANGELOG.md](CHANGELOG.md) is not a record of the work — it drives the release. `@firefoxic/release-it` reads the `## [Unreleased]` section and derives the bump from the first heading it finds there, in this order: `### Changed` ⇒ major, `### Added` ⇒ minor, `### Fixed` ⇒ patch. So a fix filed under `Changed` ships a major version. An empty `Unreleased` section aborts the release. Releases happen by merging `main` → `release`; a `release-<suffix>` branch publishes a prerelease under that suffix instead.

Entries are written from the user's point of view, as “something **now** behaves like this”, not as a description of what was done. Never “added support for…” or “fixed a bug in…”. Name the subject first, then what is now true of it:

```markdown
- The package now provides type declarations.
- Icons whose identifiers share a prefix no longer break each other's references.
```

An optional sentence after that says what it means for the user — for a breaking change, what they will most likely have to fix; for a feature, what they can do with it now; for a fix, what they can now do without fear or which workaround they can drop. Where possible, end the entry with a link to the issue or PR in parentheses, plus the author's profile for outside contributions. Follow the surrounding entries: most of this file carries no links, and multi-part entries use a nested list rather than a long sentence.

Purely internal changes — build tooling, test layout, CI — get no entry at all, since any entry forces a release.

## Prose typography

[README.md](README.md) binds short function words to the word that follows with a non-breaking space (`U+00A0`) — articles, prepositions and short conjunctions: `a`, `an`, `the`, `in`, `of`, `to`, `into`, `for`, `from`, `at`, `on`, `by`, `with`, `under`, `via`, `and`, `but`, `do`, `does`. An em dash is bound to the word *before* it, so that it never starts a line. Words like `is`, `not`, `no` and `can` are left alone. Match this when editing prose there; [CHANGELOG.md](CHANGELOG.md) does not follow the convention.

## Commit messages

The subject line is one imperative sentence, capitalized, with no trailing period and **no conventional-commits prefix** — write `Fix the build target`, never `fix:`, `chore(build):` or the like. Wrap code identifiers in backticks (`` Migrate from `node:test` to `vitest` ``). Explain the why in the body when the subject cannot carry it.
