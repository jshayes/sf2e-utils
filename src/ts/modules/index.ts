import {
  combatManagerMacros,
  registerCombatManagerModule,
  unregisterCombatManagerModule,
} from "./combatManager";
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
import {
  registerRollResolverModule,
  unregisterRollResolverModule,
} from "./rollResolver";
import {
  registerWindowManagerModule,
  unregisterWindowManagerModule,
  windowManagerMacros,
} from "./windowManager";
import {
  registerWindowResizerModule,
  unregisterWindowResizerModule,
} from "./windowResizer";

export const moduleMacros = {
  combatManager: combatManagerMacros,
  numberTracker: numberTrackerMacros,
  windowManager: windowManagerMacros,
};

export function registerModules() {
  registerCombatManagerModule();
  registerDiceSoNiceModule();
  registerHideDeadModule();
  registerJournalEditorEnhancementsModule();
  registerRollResolverModule();
  registerWindowManagerModule();
  registerWindowResizerModule();
}

export function unregisterModules() {
  unregisterCombatManagerModule();
  unregisterDiceSoNiceModule();
  unregisterHideDeadModule();
  unregisterJournalEditorEnhancementsModule();
  unregisterRollResolverModule();
  unregisterWindowManagerModule();
  unregisterWindowResizerModule();
}
