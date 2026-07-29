import {
  registerCombatHooks,
  unregisterCombatHooks,
} from "./hooks/combatHooks";
import {
  registerAudioEffectsHooks,
  unregisterAudioEffectsHooks,
} from "./hooks/audioEffectsHooks";
import {
  registerAudioEffectsUiHooks,
  unregisterAudioEffectsUiHooks,
} from "./hooks/audioEffectsUiHooks";
import { registerSceneHooks, unregisterSceneHooks } from "./hooks/sceneHooks";
import {
  setCurrentAudioEffects,
  setPlaylistAudioEffects,
} from "./macros/setCurrentAudioEffects";
import { switchToPlaylist } from "./macros/switchToPlaylist";
import { switchToPreviousPlaylist } from "./macros/switchToPreviousPlaylist";
import { registerSettings } from "./settings";

export const playlistMacros = {
  setCurrentAudioEffects,
  setPlaylistAudioEffects,
  switchToPlaylist,
  switchToPreviousPlaylist,
};

export function registerPlaylistModule() {
  registerSettings();
  registerAudioEffectsHooks();
  registerAudioEffectsUiHooks();
  registerCombatHooks();
  registerSceneHooks();
}

export function unregisterPlaylistModule() {
  unregisterAudioEffectsHooks();
  unregisterAudioEffectsUiHooks();
  unregisterCombatHooks();
  unregisterSceneHooks();
}
