import { moduleId } from "../../../constants";
import {
  normalizeAudioEffectsState,
  SetPlaylistAudioEffectsInput,
} from "../audioEffects";
import { audioEffectsFlagKey } from "../constants";

export async function setPlaylistAudioEffects(
  input: SetPlaylistAudioEffectsInput,
): Promise<number> {
  if (!game.user.isGM) {
    ui.notifications.error("Only a GM can change synchronized audio effects.");
    return 0;
  }

  const state = normalizeAudioEffectsState(input);
  const playlistName = input.playlistName?.trim();
  const namedPlaylist = playlistName
    ? game.playlists.getName(playlistName)
    : undefined;

  if (playlistName && !namedPlaylist) {
    ui.notifications.error(`Playlist not found: ${playlistName}`);
    return 0;
  }

  const targetPlaylists = namedPlaylist
    ? [namedPlaylist]
    : game.playlists.filter((playlist) =>
        playlist.sounds.some((playlistSound) => playlistSound.playing),
      );

  if (targetPlaylists.length === 0) {
    ui.notifications.warn("No playlists are currently playing.");
    return 0;
  }

  for (const playlist of targetPlaylists) {
    await playlist.setFlag(moduleId, audioEffectsFlagKey, state);
  }

  return targetPlaylists.length;
}

// Keep the original API name working for existing macros.
export const setCurrentAudioEffects = setPlaylistAudioEffects;
