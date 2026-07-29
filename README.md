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

## Synchronized playlist audio effects

The playlist utility can fade a low-pass filter and amplifier onto whichever sound
is playing in a named playlist. The effect follows that playlist when it advances
to another track. Run this from a GM-owned script macro:

```js
await game.sf2eUtils.macros.playlist.setPlaylistAudioEffects({
  enabled: true,
  playlistName: "Combat Music",
  cutoffHz: 800,
  amplifyDb: 3,
  fadeMs: 2000,
});
```

Fade the effects back out and remove their audio nodes with:

```js
await game.sf2eUtils.macros.playlist.setPlaylistAudioEffects({
  enabled: false,
  playlistName: "Combat Music",
  fadeMs: 2000,
});
```

Omit `playlistName` to target every playlist that is currently playing. The state
is stored on each affected `Playlist` and synchronized by Foundry. Every connected
client applies the Web Audio nodes locally, including clients that refresh while
an affected sound is playing.

Gamemasters also receive a filter button on each playlist row in the Playlists
sidebar. Its highlighted state indicates that the effect is enabled. The playlist
configuration sheet includes controls for the enabled state, cutoff frequency,
amplification, and effect fade duration. These controls are not rendered for
players.
