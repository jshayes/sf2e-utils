import {
  registerDiceSoNiceModule,
  unregisterDiceSoNiceModule,
} from "./diceSoNice";

export function registerModules() {
  registerDiceSoNiceModule();
}

export function unregisterModules() {
  unregisterDiceSoNiceModule();
}
