import { moduleId } from "../../../constants";
import { HooksManager } from "../../../helpers/hooks";
import { combatSettingKey } from "../constants";
import { switchToPlaylist } from "../macros/switchToPlaylist";
import { switchToPreviousPlaylist } from "../macros/switchToPreviousPlaylist";

const hooks = new HooksManager();
export function registerCombatHooks() {
  hooks.on("createCombat", async () => {
    if (!game.user.isGM) return;

    const playlistName = game.settings.get(
      moduleId,
      combatSettingKey,
    ) as string;
    if (!playlistName) return;

    await switchToPlaylist({ playlistName });
  });

  hooks.on("deleteCombat", async () => {
    if (!game.user.isGM) return;

    await switchToPreviousPlaylist();
  });
}

export function unregisterCombatHooks() {
  hooks.off();
}
