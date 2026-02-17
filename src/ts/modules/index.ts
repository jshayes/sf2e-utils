import {
  registerDiceSoNiceModule,
  unregisterDiceSoNiceModule,
} from "./diceSoNice";
import { numberTrackerMacros } from "./numberTracker";

export const moduleMacros = {
  numberTracker: numberTrackerMacros,
};

export function registerModules() {
  registerDiceSoNiceModule();
}

export function unregisterModules() {
  unregisterDiceSoNiceModule();
}
