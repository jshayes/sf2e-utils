import {
  registerHideDeadHooks,
  unregisterHideDeadHooks,
} from "./hooks/hideDeadHooks";

export function registerHideDeadModule() {
  registerHideDeadHooks();
}

export function unregisterHideDeadModule() {
  unregisterHideDeadHooks();
}
