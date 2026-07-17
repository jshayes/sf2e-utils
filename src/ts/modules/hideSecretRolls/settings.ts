import { moduleId } from "../../constants";
import { HIDE_SECRET_ROLLS_SETTING } from "./constants";

export function hideSecretRollsIsEnabled(): boolean {
  return game.settings.get(moduleId, HIDE_SECRET_ROLLS_SETTING) as boolean;
}

export function registerHideSecretRollsSettings(): void {
  game.settings.register(moduleId, HIDE_SECRET_ROLLS_SETTING, {
    name: "Hide secret rolls",
    hint: "Hide GM-authored blind and secret rolls from players, including their sounds.",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
    onChange: () => {
      void ui.chat.render({ force: true });
    },
  });
}
