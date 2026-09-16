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
import {
  registerHideInCharacterMessagesModule,
  unregisterHideInCharacterMessagesModule,
} from "./hideInCharacterMessages";
import {
  registerCardCounterModule,
  unregisterCardCounterModule,
} from "./cardCounter";
import {
  registerClickScriptRegionModule,
  unregisterClickScriptRegionModule,
} from "./clickScriptRegion";
import {
  registerCcmCardLayerRefreshModule,
  unregisterCcmCardLayerRefreshModule,
} from "./ccmCardLayerRefresh";

export const moduleMacros = {
  combatManager: combatManagerMacros,
  numberTracker: numberTrackerMacros,
  playlist: playlistMacros,
  radialMenu: radialMenuMacros,
  windowManager: windowManagerMacros,
  worldClock: worldClockMacros,
};

export function registerModules() {
  registerCardCounterModule();
  registerCcmCardLayerRefreshModule();
  registerClickScriptRegionModule();
  registerCombatManagerModule();
  registerDiceSoNiceModule();
  registerFoundryControlsModule();
  registerHideDeadModule();
  registerHideEnemyNamesModule();
  registerHideInCharacterMessagesModule();
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
  unregisterCardCounterModule();
  unregisterCcmCardLayerRefreshModule();
  unregisterClickScriptRegionModule();
  unregisterCombatManagerModule();
  unregisterDiceSoNiceModule();
  unregisterFoundryControlsModule();
  unregisterFoundryControlsModule();
  unregisterHideDeadModule();
  unregisterHideEnemyNamesModule();
  unregisterHideInCharacterMessagesModule();
  unregisterHideSecretRollsModule();
  unregisterJournalEditorEnhancementsModule();
  unregisterPauseTweaksModule();
  unregisterPlaylistModule();
  unregisterPlaylistModule();
  unregisterRadialMenuModule();
  unregisterRegionTransparencyModule();
  unregisterRollResolverModule();
  unregisterWindowManagerModule();
  unregisterWindowResizerModule();
  unregisterWorldClockModule();
}
