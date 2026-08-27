import {
  registerRegionMeshOpacityPatch,
  unregisterRegionMeshOpacityPatch,
} from "./regionMeshPatch";
import { registerRegionTransparencySettings } from "./settings";

export function registerRegionTransparencyModule(): void {
  registerRegionTransparencySettings();
  registerRegionMeshOpacityPatch();
}

export function unregisterRegionTransparencyModule(): void {
  unregisterRegionMeshOpacityPatch();
}
