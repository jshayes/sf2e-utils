import {
  registerCombatHooks,
  unregisterCombatHooks,
} from "./hooks/combatHooks";
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
}

export function unregisterPlaylistModule() {
  unregisterCombatHooks();
}
