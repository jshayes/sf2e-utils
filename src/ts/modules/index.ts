import {
  combatManagerMacros,
  registerCombatManagerModule,
  unregisterCombatManagerModule,
} from "./combatManager";
import {
  registerDiceSoNiceModule,
  unregisterDiceSoNiceModule,
} from "./diceSoNice";
import {
  registerFoundryControlsModule,
  unregisterFoundryControlsModule,
} from "./foundryControls";
import { registerHideDeadModule, unregisterHideDeadModule } from "./hideDead";
import {
  registerJournalEditorEnhancementsModule,
  unregisterJournalEditorEnhancementsModule,
} from "./journalEditorEnhancements";
import { numberTrackerMacros } from "./numberTracker";
import {
  registerPauseTweaksModule,
  unregisterPauseTweaksModule,
} from "./pauseTweaks";
import {
  registerRollResolverModule,
  unregisterRollResolverModule,
} from "./rollResolver";
import {
  radialMenuMacros,
  registerRadialMenuModule,
  unregisterRadialMenuModule,
} from "./radialMenu";
import {
  registerWindowManagerModule,
  unregisterWindowManagerModule,
  windowManagerMacros,
} from "./windowManager";
import {
  registerWindowResizerModule,
  unregisterWindowResizerModule,
} from "./windowResizer";
import { registerPlaylistModule, unregisterPlaylistModule } from "./playlist";
import {
  registerHideSecretRollsModule,
  unregisterHideSecretRollsModule,
} from "./hideSecretRolls";

export const moduleMacros = {
  combatManager: combatManagerMacros,
  numberTracker: numberTrackerMacros,
  radialMenu: radialMenuMacros,
  windowManager: windowManagerMacros,
};

export function registerModules() {
  registerChatTabsModule();
  registerCombatManagerModule();
  registerDiceSoNiceModule();
  registerFoundryControlsModule();
  registerHideDeadModule();
  registerHideSecretRollsModule();
  registerJournalEditorEnhancementsModule();
  registerPauseTweaksModule();
  registerPlaylistModule();
  registerRadialMenuModule();
  registerRollResolverModule();
  registerWindowManagerModule();
  registerWindowResizerModule();
}

export function unregisterModules() {
  unregisterChatTabsModule();
  unregisterCombatManagerModule();
  unregisterDiceSoNiceModule();
  unregisterFoundryControlsModule();
  unregisterHideDeadModule();
  unregisterHideSecretRollsModule();
  unregisterJournalEditorEnhancementsModule();
  unregisterPauseTweaksModule();
  unregisterPlaylistModule();
  unregisterRadialMenuModule();
  unregisterRollResolverModule();
  unregisterWindowManagerModule();
  unregisterWindowResizerModule();
  unregisterFoundryControlsModule();
  unregisterPlaylistModule();
}
