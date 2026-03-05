import { moduleId } from "../../constants";
import { combatSettingKey } from "./constants";

export function registerSettings() {
  game.settings.register(moduleId, combatSettingKey, {
    name: "Combat playlist name",
    scope: "world",
    config: true,
    type: String,
    default: "",

    //@ts-ignore
    restricted: true,
  });
}
