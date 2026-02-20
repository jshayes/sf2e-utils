import { moduleId } from "../../../constants";
import { DicePresetManagerApp } from "../applications/dicePresetManagerApp";
import { FLAG_KEY } from "../constants";
import { DicePresetFlags, Die } from "../types";
import { loadDiceForUser } from "../utils";

function getElementForMessage<T>(messageId: string, arr: T[]) {
  const n = stringToUnitFloat(messageId);
  return arr[Math.floor(n * arr.length)];
}

function stringToUnitFloat(str: string) {
  // FNV-1a 32-bit hash
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0) / 4294967296;
}

let diceSoNiceRollStartHook: number;
let diceSoNiceReadyHook: number;
let getHeaderControlsDiceConfig: number;
let updateUserHook: number;

export function registerDiceSoNiceHooks(): void {
  updateUserHook = Hooks.on("updateUser", async (user, diff) => {
    if (diff?.flags?.["dice-so-nice"]?.appearance) {
      await loadDiceForUser(user);
    }

    if (diff?.flags?.[moduleId]?.[FLAG_KEY]) {
      await loadDiceForUser(user);
    }
  });

  diceSoNiceReadyHook = Hooks.on("diceSoNiceReady", async () => {
    setTimeout(async () => {
      console.log("loading dice");
      await Promise.all(
        game.users.contents.map((user) => loadDiceForUser(user)),
      );
    }, 0);
  });

  diceSoNiceRollStartHook = Hooks.on(
    "diceSoNiceRollStart",
    (messageId, options) => {
      const presets = Object.values(
        (options.user.getFlag(moduleId, FLAG_KEY) as DicePresetFlags) ?? {},
      ).filter((x) => x.enabled);

      if (presets.length) {
        const preset = getElementForMessage(messageId, presets);
        options.roll.appearance = preset.appearance;

        options.roll.dice.forEach((die: Die) => {
          const key = `d${die.faces}`;
          if (key in preset.appearance) {
            die.options.appearance = foundry.utils.deepClone(
              preset.appearance[key],
            );
          } else {
            die.options.appearance = foundry.utils.deepClone(
              preset.appearance.global,
            );
          }
        });
      }
    },
  );

  getHeaderControlsDiceConfig = Hooks.on(
    "getHeaderControlsDiceConfig",
    (_, controls: foundry.applications.ApplicationHeaderControlsEntry[]) => {
      controls.push({
        icon: "fa-solid fa-dice",
        label: "Presets",
        action: "dice-preset-manager",
        onClick: () => {
          void new DicePresetManagerApp().render({ force: true });
        },
      });
    },
  );
}

export function unregisterDiceSoNiceHooks() {
  Hooks.off("updateUser", updateUserHook);
  Hooks.off("diceSoNiceReady", diceSoNiceReadyHook);
  Hooks.off("diceSoNiceRollStart", diceSoNiceRollStartHook);
  Hooks.off("getHeaderControlsDiceConfig", getHeaderControlsDiceConfig);
}
