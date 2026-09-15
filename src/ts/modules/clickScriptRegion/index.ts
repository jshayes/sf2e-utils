import {
  clickScriptRegionBehaviorType,
  ClickScriptRegionBehaviorType,
} from "./behavior";
import {
  registerClickScriptRegionListener,
  unregisterClickScriptRegionListener,
} from "./listener";

export function registerClickScriptRegionModule(): void {
  CONFIG.RegionBehavior.dataModels[clickScriptRegionBehaviorType] =
    ClickScriptRegionBehaviorType;
  CONFIG.RegionBehavior.typeLabels[clickScriptRegionBehaviorType] =
    "SF2E_UTILS.ClickScriptRegion.BehaviorLabel";
  CONFIG.RegionBehavior.typeIcons[clickScriptRegionBehaviorType] =
    "fa-solid fa-computer-mouse";

  registerClickScriptRegionListener();
}

export function unregisterClickScriptRegionModule(): void {
  unregisterClickScriptRegionListener();

  if (
    CONFIG.RegionBehavior.dataModels[clickScriptRegionBehaviorType] ===
    ClickScriptRegionBehaviorType
  ) {
    delete CONFIG.RegionBehavior.dataModels[clickScriptRegionBehaviorType];
    delete CONFIG.RegionBehavior.typeLabels[clickScriptRegionBehaviorType];
    delete CONFIG.RegionBehavior.typeIcons[clickScriptRegionBehaviorType];
  }
}
