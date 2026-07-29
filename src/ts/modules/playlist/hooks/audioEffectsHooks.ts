import type { Playlist } from "foundry-pf2e/foundry/client/documents/_module.mjs";
import { HooksManager } from "../../../helpers/hooks";
import {
  applyPlaylistAudioEffects,
  getPlaylistAudioEffectsState,
  removeAllLocalPlaylistAudioEffects,
  applyEnabledEffects,
  applyDisabledEffects,
} from "../audioEffects";

const hooks = new HooksManager();
let registration = 0;

async function synchronizePlayingSounds(): Promise<void> {
  const playingPlaylists = game.playlists.contents.filter((playlist) =>
    playlist.sounds.some((playlistSound) => playlistSound.playing),
  );

  await Promise.all(
    playingPlaylists.map((playlist) => {
      const state = getPlaylistAudioEffectsState(playlist);
      return applyPlaylistAudioEffects(playlist, { ...state, fadeMs: 0 });
    }),
  );
}

async function restorePlayingSounds(): Promise<void> {
  await game.audio.unlock;
  void synchronizePlayingSounds();
}

function isFlagUpdate(changes: Record<string, unknown>): boolean {
  return (
    "flags" in changes ||
    Object.keys(changes).some((key) => key.startsWith("flags."))
  );
}

type PlayingUpdate = {
  sounds: { playing: boolean; _id: string }[];
};
function isPlayingUpdate(
  changes: Record<string, unknown>,
): changes is PlayingUpdate {
  return "sounds" in changes;
}

export function registerAudioEffectsHooks(): void {
  registration += 1;
  hooks.on("ready", restorePlayingSounds);

  hooks.on(
    "updatePlaylist",
    async (playlist: Playlist, changes: Record<string, unknown>) => {
      if (isFlagUpdate(changes)) {
        await applyPlaylistAudioEffects(playlist);
      }

      if (isPlayingUpdate(changes)) {
        const wait = playlist.fade ?? 0;
        const state = getPlaylistAudioEffectsState(playlist);
        changes.sounds.map(async ({ playing, _id }) => {
          const sound = playlist.sounds.get(_id).sound;
          if (!state.enabled) {
            await applyDisabledEffects(sound, 0);
            return;
          }

          if (playing) {
            await applyEnabledEffects(sound, { ...state, fadeMs: 0 });
          } else {
            await new Promise((res) => setTimeout(res, wait));
            await applyDisabledEffects(sound, 0);
          }
        });
      }
    },
  );

  // The ready hook has already fired when this module is replaced by Vite HMR.
  if (game.ready) restorePlayingSounds();
}

export function unregisterAudioEffectsHooks(): void {
  registration += 1;
  hooks.off();
  removeAllLocalPlaylistAudioEffects();
}
