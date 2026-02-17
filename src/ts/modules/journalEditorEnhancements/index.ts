import {
  registerJournalEditorEnhancementsHooks,
  unregisterJournalEditorEnhancementsHooks,
} from "./hooks/journalEditorEnhancementsHooks";

export function registerJournalEditorEnhancementsModule() {
  registerJournalEditorEnhancementsHooks();
}

export function unregisterJournalEditorEnhancementsModule() {
  unregisterJournalEditorEnhancementsHooks();
}
