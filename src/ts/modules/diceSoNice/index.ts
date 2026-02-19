import { registerDiceSoNiceHooks, unregisterDiceSoNiceHooks } from "./hooks";

export function registerDiceSoNiceModule() {
  registerDiceSoNiceHooks();
}

export function unregisterDiceSoNiceModule() {
  unregisterDiceSoNiceHooks();
}
