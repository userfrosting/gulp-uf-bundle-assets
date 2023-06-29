# Contributing

## Getting Started

To start, you'll need NodeJS 14 and pnpm.

The development and release process heavily lean into common package scripts, the only commands you need to care about are;

- `pnpm run compile` to build.
- `pnpm test` to run tests.

## API Documentation

API documentation is derived from source using [API Extractor](https://www.npmjs.com/package/@microsoft/api-extractor) and [API Documenter](https://www.npmjs.com/package/@microsoft/api-documenter). Entities tagged with `@public` will be included in API generated documentation.

Generation occurs automatically when `pnpm version` is run.

## Release process

Generally speaking, all releases should first traverse through `alpha`, `beta`, and `rc` (release candidate) to catch missed bugs and gather feedback as appropriate. Aside from this however, there are a few steps that **MUST** always be done.

1. Make sure [`CHANGELOG.md`](./CHANGELOG.md) is up to date.
2. Update `version` in `package.json`.
3. `pnpm run stamp-version`
4. Commit changes.
5. `git tag v${version}`
6. `pnpm publish`
7. Create release on GitHub from tag made by `npm version`.
