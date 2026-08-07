# AGENTS.md

This file provides guidance to coding agents when working with code in this repository.

## Commands

All tasks go through the `Makefile` (targets add `node_modules/.bin` to `PATH`, so no `pnpm exec` prefix is needed):

| Command | Effect |
| --- | --- |
| `make setup` | Check that pnpm is on `PATH`, `pnpm ci`, point `core.hooksPath` at `.githooks` |
| `make check` | `tsc --noEmit` |
| `make lint` / `make fix` | `oxlint` / `oxlint --fix` |
| `make build` | Runs `check` + `lint`, then bundles with `tsdown` into `dist/` |
| `make test` | Runs `build` first, then `vitest run` |
| `make release` | Runs `test`, then `pnpm dlx @firefoxic/release-it` |

**Tests import from `dist/`, not `src/`.** [test/index.js](test/index.js) does `import { stacksvg } from "../dist/index.js"`, which is why `test` depends on `build`. Editing `src/` and running `vitest` directly will silently test stale output — always go through `make test`, or rebuild manually first.

Single test: `make build` once, then `vitest run -t "part of the test name"`.

Manual smoke check: `gulp createStack` regenerates [docs/example/stack.svg](docs/example/stack.svg) from [docs/example/icons/](docs/example/icons) using the built `dist/`.

The pre-commit hook stashes unstaged work, lints staged `.js`/`.ts` files, and runs `make test`.

## Architecture

The plugin is a gulp (Vinyl) transform stream that accumulates icons in memory and emits exactly one file, `stack.svg`, on flush.

- [src/index.ts](src/index.ts) — the gulp adapter layer only. `stacksvg()` builds a `node:stream` `Transform` in object mode and assigns `_transform` / `_flush`. `_transform` skips null files, rejects streamed files, and feeds buffer contents to the processor; thrown processor errors become `PluginError`s. `_flush` asks the processor for the sprite and pushes a single `Vinyl` named `stack.svg` — or nothing at all if no valid SVG was seen.
- [src/svg-processor.ts](src/svg-processor.ts) — all SVG logic, framework-agnostic. `StackSvgCreator` holds the growing DOM (`node-html-parser`), seeded with `<svg><style>:root svg:not(:target){display:none}</style></svg>`. That style rule is the entire stack technique: only the `:target` fragment renders.

`StackSvgCreator.add()` per icon:

1. Derives the fragment id from the file's relative path — directory separators become `_`, whitespace becomes `-`, extension dropped. Duplicate ids throw (`File name should be unique: …`), which surfaces as a stream error.
2. Synthesizes `viewBox` from `width`/`height` when absent, then strips presentation attributes that would leak into the sprite (`excessAttrs`: `width`, `height`, `x`, `y`, `version`, `enable-background`, `xml:space`).
3. Rewrites every inner `id` to `<iconId>_<index>` and patches all `#oldId` references across the icon's attributes — this is what keeps masks/gradients from colliding between icons in a shared document.
4. Reconciles namespaces (see below), then appends the icon's root `<svg>` into the stack root.

Namespace reconciliation (`#processNamespaces`) is the subtlest part. A `Map<nsURI, attrName>` accumulates namespaces on the root, seeded with the SVG namespace. Per `xmlns*` attribute on an icon:

- Same URI already registered under a different alias → the icon's alias is rewritten to the registered one.
- `http://www.w3.org/1999/xlink` → alias dropped entirely (`xlink:href` becomes `href`).
- Alias collides with a different URI → the alias gets a 7-char HMAC-SHA1 suffix of the URI (deterministic, so test expectations are stable).
- A namespace is hoisted onto the root only if the icon actually uses it after renaming — unused declarations are dropped.

The `xmlns*` attribute is always removed from the icon element; declarations live only on the stack root, written in `getStackSprite()`.

[src/vinyl.d.ts](src/vinyl.d.ts) is a hand-written ambient module declaration for `vinyl` (no bundled types); extend it rather than reaching for `any`.

## Conventions

- Backtick template literals for all string literals, including plain ones (`` `stack.svg` ``, not `"stack.svg"`). Import specifiers stay double-quoted.
- Tabs, no semicolons, `let` over `const`, space before function parameter parens (`function transform (…)`).
- `isolatedDeclarations: true` — every exported binding needs an explicit type annotation; `exactOptionalPropertyTypes` is on too.
- JSDoc blocks on exported and private methods, even in TypeScript.
- Tests are plain `.js` under `test/` and assert on exact serialized sprite strings, so any output change (attribute order, whitespace, self-closing form) requires updating those literals.
