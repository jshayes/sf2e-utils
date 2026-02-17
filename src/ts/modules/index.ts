import {
  registerDiceSoNiceModule,
  unregisterDiceSoNiceModule,
} from "./diceSoNice";
import { registerHideDeadModule, unregisterHideDeadModule } from "./hideDead";
import {
  registerJournalEditorEnhancementsModule,
  unregisterJournalEditorEnhancementsModule,
} from "./journalEditorEnhancements";
import { numberTrackerMacros } from "./numberTracker";

export const moduleMacros = {
  numberTracker: numberTrackerMacros,
};

export function registerModules() {
  registerDiceSoNiceModule();
  registerHideDeadModule();
  registerJournalEditorEnhancementsModule();
}

export function unregisterModules() {
  unregisterDiceSoNiceModule();
  unregisterHideDeadModule();
  unregisterJournalEditorEnhancementsModule();
}
