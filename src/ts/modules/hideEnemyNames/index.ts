import {
  registerHideEnemyNamesHooks,
  unregisterHideEnemyNamesHooks,
} from "./hooks/hideEnemyNamesHooks";

export function registerHideEnemyNamesModule(): void {
  registerHideEnemyNamesHooks();
}

export function unregisterHideEnemyNamesModule(): void {
  unregisterHideEnemyNamesHooks();
}
