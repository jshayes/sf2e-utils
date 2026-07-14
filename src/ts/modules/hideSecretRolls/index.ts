import {
  registerHideSecretRollsHooks,
  unregisterHideSecretRollsHooks,
} from "./hooks";

export function registerHideSecretRollsModule() {
  registerHideSecretRollsHooks();
}

export function unregisterHideSecretRollsModule() {
  unregisterHideSecretRollsHooks();
}
