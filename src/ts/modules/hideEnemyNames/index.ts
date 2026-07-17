import {
  registerHideEnemyNamesHooks,
  unregisterHideEnemyNamesHooks,
} from "./hooks/hideEnemyNamesHooks";
import { registerHideEnemyNamesSettings } from "./settings";

export function registerHideEnemyNamesModule(): void {
  registerHideEnemyNamesSettings();
  registerHideEnemyNamesHooks();
}

export function unregisterHideEnemyNamesModule(): void {
  unregisterHideEnemyNamesHooks();
}
