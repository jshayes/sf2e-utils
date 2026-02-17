import {
  registerDiceSoNiceHooks,
  unregisterDiceSoNiceHooks,
} from "./hooks/diceSoNiceHooks";

export function registerDiceSoNiceModule() {
  registerDiceSoNiceHooks();
}

export function unregisterDiceSoNiceModule() {
  unregisterDiceSoNiceHooks();
}
