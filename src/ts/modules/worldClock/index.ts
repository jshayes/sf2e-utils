import {
  applyCustomCalendarNames,
  restoreOriginalCalendarNames,
} from "./calendarNames";
import { renderPlanetClocks } from "./planetClocksApp";
import { registerPlanetClockStore } from "./planetClockStore";
import {
  registerWorldClockHooks,
  unregisterWorldClockHooks,
} from "./worldClockHooks";

const updateWorldTime = (): void => renderPlanetClocks();

export function registerWorldClockModule(): void {
  applyCustomCalendarNames();
  registerPlanetClockStore(renderPlanetClocks);
  registerWorldClockHooks();
  Hooks.on("updateWorldTime", updateWorldTime);
}

export function unregisterWorldClockModule(): void {
  restoreOriginalCalendarNames();
  unregisterWorldClockHooks();
  Hooks.off("updateWorldTime", updateWorldTime);
}

export { worldClockMacros } from "./macros";
