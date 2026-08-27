import { moduleId } from "../../constants";

const REGION_OPACITY_SETTING = "regionOpacity";
const DEFAULT_REGION_OPACITY = 1;

export function registerRegionTransparencySettings(): void {
  game.settings.register(moduleId, REGION_OPACITY_SETTING, {
    name: "Region opacity",
    hint: "Controls how opaque Region fills appear on the canvas, from 0 (invisible) to 1 (fully opaque). Region borders, controls, and drawing previews remain at full opacity.",
    scope: "client",
    config: true,
    type: Number,
    default: DEFAULT_REGION_OPACITY,
    range: {
      min: 0,
      max: 1,
      step: 0.05,
    } as never, // Foundry's typings incorrectly resolve numeric ranges to never.
  });
}

export function getRegionOpacity(): number {
  const opacity = Number(game.settings.get(moduleId, REGION_OPACITY_SETTING));
  return Number.isFinite(opacity)
    ? Math.clamp(opacity, 0, 1)
    : DEFAULT_REGION_OPACITY;
}
