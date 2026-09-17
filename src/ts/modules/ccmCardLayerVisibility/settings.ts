import { moduleId } from "../../constants";

export const SHOW_CCM_CARD_LAYER_TO_PLAYERS_SETTING =
  "showCcmCardLayerToPlayers";

export function showCcmCardLayerToPlayers(): boolean {
  return game.settings.get(
    moduleId,
    SHOW_CCM_CARD_LAYER_TO_PLAYERS_SETTING,
  ) as boolean;
}

export function registerCcmCardLayerVisibilitySettings(): void {
  game.settings.register(moduleId, SHOW_CCM_CARD_LAYER_TO_PLAYERS_SETTING, {
    name: "Show CCM card layer to players",
    hint: "Allow players to access Complete Card Management's Cards canvas layer and its scene controls. Game Masters always retain access.",
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
    onChange: async (value: unknown) => {
      const showToPlayers = value === true;

      if (
        !game.user.isGM &&
        !showToPlayers &&
        ui.controls.control?.name === "cards"
      ) {
        await ui.controls.activate({ control: "tokens" });
      }

      await ui.controls.render({ force: true, reset: true });
    },
  });
}
