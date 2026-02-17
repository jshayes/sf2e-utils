import { moduleId } from "../../../constants";
import { FLAG_KEY } from "../constants";
import { applyPreset, loadDiceForUser } from "../utils";

function randomElement<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function registerDiceSoNiceHooks(): void {
  Hooks.on("diceSoNiceRollStart", async (_, options) => {
    if (options.user.id === game.user.id) {
      const presets = Object.values(
        game.user.getFlag(moduleId, FLAG_KEY) ?? {},
      ).filter((x) => x.enabled);

      if (presets.length) {
        const preset = randomElement(presets);
        await applyPreset(preset);
      }
    }

    await loadDiceForUser(options.user);
  });
}
