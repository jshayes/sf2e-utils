import {
  registerCombatHooks,
  unregisterCombatHooks,
} from "./hooks/combatHooks";
import { registerSceneHooks, unregisterSceneHooks } from "./hooks/sceneHooks";
import { switchToPlaylist } from "./macros/switchToPlaylist";
import { switchToPreviousPlaylist } from "./macros/switchToPreviousPlaylist";
import { registerSettings } from "./settings";

export const playlistMacros = {
  switchToPlaylist,
  switchToPreviousPlaylist,
};

export function registerPlaylistModule() {
  registerSettings();
  registerCombatHooks();
  registerSceneHooks();
}

export function unregisterPlaylistModule() {
  unregisterCombatHooks();
  unregisterSceneHooks();
}
