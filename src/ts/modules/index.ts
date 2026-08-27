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
  registerRegionTransparencyModule,
  unregisterRegionTransparencyModule,
} from "./regionTransparency";
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
  registerWorldClockModule,
  unregisterWorldClockModule,
  worldClockMacros,
} from "./worldClock";
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
  worldClock: worldClockMacros,
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
  registerRegionTransparencyModule();
  registerRollResolverModule();
  registerWindowManagerModule();
  registerWindowResizerModule();
  registerWorldClockModule();
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
  unregisterRegionTransparencyModule();
  unregisterRollResolverModule();
  unregisterWindowManagerModule();
  unregisterWindowResizerModule();
  unregisterWorldClockModule();
  unregisterFoundryControlsModule();
  unregisterPlaylistModule();
}
