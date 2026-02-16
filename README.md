# sf2e-utils

## Install URL (Foundry VTT)

Use this manifest URL in Foundry's Module Installer:

`https://github.com/jshayes/sf2e-utils/releases/latest/download/module.json`

## Release / Deployment

1. Bump `version` in `src/module.json` (or create a matching `vX.Y.Z` tag).
2. Push your changes.
3. Create a GitHub Release (published) with a tag like `v1.2.3`.

The `Publish release` workflow will:

- run `npm ci`
- build the module with release metadata
- pack macros
- create `dist/module.zip`
- upload `dist/module.json` and `dist/module.zip` as release assets

Foundry will then install/update from the `releases/latest/download/module.json` URL.
