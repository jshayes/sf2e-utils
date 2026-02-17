import { DicePreset } from "./types";

interface Scope {
  system: string;
}

type Appearance = Record<string, Scope>;

export async function loadDiceForUser(user: foundry.documents.User) {
  const appearance = user.getFlag("dice-so-nice", "appearance") as Appearance;
  const diceFactory = (game as any).dice3d.DiceFactory;

  const presets = [];
  for (let scope in appearance) {
    if (appearance.hasOwnProperty(scope)) {
      if (scope != "global") {
        presets.push(
          diceFactory.getPresetBySystem(scope, appearance[scope].system),
        );
      } else if (diceFactory.systems.has(appearance[scope].system)) {
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

export async function applyPreset(preset: DicePreset): Promise<void> {
  const currentAppearance = (game.user.getFlag("dice-so-nice", "appearance") ??
    {}) as Record<string, unknown>;
  const nextAppearance = foundry.utils.deepClone(currentAppearance);
  foundry.utils.setProperty(
    nextAppearance,
    "global",
    foundry.utils.deepClone(preset.appearance),
  );

  await game.user.setFlag("dice-so-nice", "appearance", nextAppearance);
}
