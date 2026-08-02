import { moduleId } from "../../constants";
import { HIDE_ENEMY_NAMES_SETTING } from "./constants";

export function hideEnemyNamesIsEnabled(): boolean {
  return game.settings.get(moduleId, HIDE_ENEMY_NAMES_SETTING) as boolean;
}

export function registerHideEnemyNamesSettings(): void {
  game.settings.register(moduleId, HIDE_ENEMY_NAMES_SETTING, {
    name: "Anonymous enemy names",
    hint: "Replace hostile creature names with their size and creature type in the combat tracker, chat cards, and actor sheets.",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
    onChange: () => {
      void ui.combat.render({ force: true });
      void ui.chat.render({ force: true });
    },
  });
}
