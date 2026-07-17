import {
  registerHideSecretRollsHooks,
  unregisterHideSecretRollsHooks,
} from "./hooks";
import { registerHideSecretRollsSettings } from "./settings";

export function registerHideSecretRollsModule() {
  registerHideSecretRollsSettings();
  registerHideSecretRollsHooks();
}

export function unregisterHideSecretRollsModule() {
  unregisterHideSecretRollsHooks();
}
