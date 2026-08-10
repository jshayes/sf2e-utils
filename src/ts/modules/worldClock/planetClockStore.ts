import { moduleId } from "../../constants";
import {
  DEFAULT_PLANET_CLOCKS,
  getPlanetLocations,
  type PlanetClockDefinition,
} from "./planetClocks";

const PLANET_CLOCKS_SETTING = "planetClocks";

export function registerPlanetClockStore(onChange: () => void): void {
  game.settings.register(moduleId, PLANET_CLOCKS_SETTING, {
    name: "Planet clocks",
    scope: "world",
    config: false,
    type: Object,
    default: DEFAULT_PLANET_CLOCKS,
    onChange,
  });
}

export function getPlanetClocks(): PlanetClockDefinition[] {
  const clocks = game.settings.get(moduleId, PLANET_CLOCKS_SETTING);
  const definitions = foundry.utils.deepClone(
    Array.isArray(clocks) ? clocks : DEFAULT_PLANET_CLOCKS,
  ) as PlanetClockDefinition[];
  return definitions.map((definition) => ({
    ...definition,
    locations: getPlanetLocations(definition),
  }));
}

export async function savePlanetClocks(
  clocks: PlanetClockDefinition[],
): Promise<void> {
  if (!game.user.isGM) return;
  await game.settings.set(moduleId, PLANET_CLOCKS_SETTING, clocks);
}
