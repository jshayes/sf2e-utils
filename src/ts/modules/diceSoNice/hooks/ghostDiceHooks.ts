import { Appearance, Die } from "../types";

let diceSoNiceRollStartHook: number;

function getGhostKey(system: string) {
  return `${system}_ghost`;
}

function getSystemForDie(appearance: Appearance, die: Die) {
  const diceFactory = (game as any).dice3d.DiceFactory;

  if (die.options.appearance?.system) {
    const key = getGhostKey(die.options.appearance.system);
    if (diceFactory.systems.has(key)) {
      return diceFactory.systems.get(key);
    }
  }

  const type = `d${die.faces}`;
  if (type in appearance) {
    const key = getGhostKey(appearance[type].system);
    if (diceFactory.systems.has(key)) {
      return diceFactory.systems.get(key);
    }
  }

  const key = getGhostKey(appearance.global.system);
  if (diceFactory.systems.has(key)) {
    return diceFactory.systems.get(key);
  }

  return null;
}

export function registerGhostDiceHooks(): void {
  diceSoNiceRollStartHook = Hooks.on("diceSoNiceRollStart", (_, options) => {
    if (game.user.isGM || !options.roll.ghost) return;

    const appearance = options.user.getFlag("dice-so-nice", "appearance");
    if (!appearance) return;

    let newGhost = true;
    for (const die of options.roll.dice ?? []) {
      die.options ??= {};
      die.options.appearance ??= {};

      const key = `d${die.faces}`;
      const system = getSystemForDie(appearance, die);

      if (!system || !system.dice.has(key)) {
        die.options.ghost = true;
        die.options.appearance = null;
        continue;
      }

      die.options.appearance.system = system.id;
      newGhost = false;

      for (const result of die.results) {
        result.result = Math.ceil(Math.random() * die.faces);
      }
    }

    const realUser = options.user ?? game.user;
    options.user = new Proxy(realUser, {
      get(target, prop, receiver) {
        if (prop === "getFlag") {
          return (scope: string, key: string) => {
            if (scope === "dice-so-nice" && key === "sfxList") return [];
            return target.getFlag(scope, key);
          };
        }
        return Reflect.get(target, prop, receiver);
      },
    });

    options.roll.ghost = newGhost;
  });
}

export function unregisterGhostDiceHooks() {
  Hooks.off("diceSoNiceRollStart", diceSoNiceRollStartHook);
}
