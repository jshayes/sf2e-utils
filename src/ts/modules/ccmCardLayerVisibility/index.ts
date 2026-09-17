import { HooksManager } from "../../helpers/hooks";
import {
  registerCcmCardLayerVisibilitySettings,
  showCcmCardLayerToPlayers,
} from "./settings";

const hooks = new HooksManager();

type SceneControls = {
  cards?: {
    tools?: Record<string, unknown>;
  };
};

function filterCcmCardLayerControl(controls: SceneControls): void {
  if (game.user.isGM) return;

  const cardControls = controls.cards;
  if (!cardControls) return;

  if (!showCcmCardLayerToPlayers()) {
    delete controls.cards;
    return;
  }

  if (!cardControls.tools) return;
  delete cardControls.tools.createGrid;
  delete cardControls.tools.createTriangle;
}

export function registerCcmCardLayerVisibilityModule(): void {
  registerCcmCardLayerVisibilitySettings();
  hooks.on("getSceneControlButtons", filterCcmCardLayerControl);
}

export function unregisterCcmCardLayerVisibilityModule(): void {
  hooks.off();
}
