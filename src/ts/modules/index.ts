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
  registerHideEnemyNamesModule,
  unregisterHideEnemyNamesModule,
} from "./hideEnemyNames";
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
import {
  playlistMacros,
  registerPlaylistModule,
  unregisterPlaylistModule,
} from "./playlist";
import {
  registerHideSecretRollsModule,
  unregisterHideSecretRollsModule,
} from "./hideSecretRolls";

export const moduleMacros = {
  combatManager: combatManagerMacros,
  numberTracker: numberTrackerMacros,
  playlist: playlistMacros,
  radialMenu: radialMenuMacros,
  windowManager: windowManagerMacros,
};

export function registerModules() {
  registerCombatManagerModule();
  registerDiceSoNiceModule();
  registerFoundryControlsModule();
  registerHideDeadModule();
  registerHideEnemyNamesModule();
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
  unregisterCombatManagerModule();
  unregisterDiceSoNiceModule();
  unregisterFoundryControlsModule();
  unregisterHideDeadModule();
  unregisterHideEnemyNamesModule();
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
