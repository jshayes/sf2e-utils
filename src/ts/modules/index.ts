import {
  registerDiceSoNiceModule,
  unregisterDiceSoNiceModule,
} from "./diceSoNice";
import { registerHideDeadModule, unregisterHideDeadModule } from "./hideDead";
import { numberTrackerMacros } from "./numberTracker";

export const moduleMacros = {
  numberTracker: numberTrackerMacros,
};

export function registerModules() {
  registerDiceSoNiceModule();
  registerHideDeadModule();
}

export function unregisterModules() {
  unregisterDiceSoNiceModule();
  unregisterHideDeadModule();
}
