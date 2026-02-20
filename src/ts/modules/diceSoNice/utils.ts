import { moduleId } from "../../constants";
import { FLAG_KEY } from "./constants";
import { Appearance, DicePreset } from "./types";

export async function loadDiceForAppearance(appearance: Appearance) {
  const diceFactory = (game as any).dice3d.DiceFactory;
  const toLoad = new Set();

  const presets = [];
  for (let scope in appearance) {
    if (appearance.hasOwnProperty(scope)) {
      if (
        appearance[scope].system &&
        !diceFactory.systems.has(appearance[scope].system)
      ) {
        ui.notifications.error("TELL JUSTIN THAT HE FUCKED UP!");
      }
      if (scope != "global") {
        const preset = diceFactory.getPresetBySystem(
          scope,
          appearance[scope].system,
        );
        if (!preset.modelLoaded) {
          toLoad.add(appearance[scope].system);
        }
        presets.push(
          diceFactory.getPresetBySystem(scope, appearance[scope].system),
        );
      } else if (diceFactory.systems.has(appearance[scope].system)) {
        diceFactory.systems
          .get(appearance[scope].system)
          .dice.values()
          .forEach((x: any) => {
            if (!x.modelLoaded) {
              toLoad.add(appearance[scope].system);
            }
          });
        presets.push(
          ...Array.from(
            diceFactory.systems.get(appearance[scope].system).dice.values(),
          ),
        );
      }
    }
  }

  await Promise.all(
    presets.map((preset) => {
      if (preset.modelFile) {
        return preset.loadModel(diceFactory.loaderGLTF);
      } else {
        return preset.loadTextures();
      }
    }),
  );
}

function getGhostDiceAppearance(appearance: Appearance) {
  return Object.fromEntries(
    Object.getOwnPropertyNames(appearance).map((property) => {
      const system = appearance[property].system;
      const ghostSystem = `${system}_ghost`;
      const hasGhost = (game as any).dice3d.DiceFactory.systems.has(
        ghostSystem,
      );
      return [
        property,
        {
          ...appearance[property],
          system: hasGhost ? ghostSystem : system,
        },
      ];
    }),
  );
}

export async function loadDiceForUser(user: foundry.documents.User) {
  const appearance = user.getFlag("dice-so-nice", "appearance") as Appearance;
  const appearances = Object.values(user.getFlag(moduleId, FLAG_KEY) ?? {})
    .filter((x) => x.enabled)
    .map((x) => x.appearance)
    .concat([appearance]);

  if (user.isGM && !game.user.isGM) {
    appearances.push(...appearances.map(getGhostDiceAppearance));
  }

  return Promise.all(
    appearances.map((appearance) => loadDiceForAppearance(appearance)),
  );
}

export async function applyPreset(preset: DicePreset): Promise<void> {
  await game.user.unsetFlag("dice-so-nice", "appearance");
  await game.user.setFlag(
    "dice-so-nice",
    "appearance",
    foundry.utils.deepClone(preset.appearance),
  );
}
