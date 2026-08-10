import {
  applyCustomCalendarNames,
  restoreOriginalCalendarNames,
} from "./calendarNames";
import { renderPlanetClocks } from "./planetClocksApp";
import {
  registerWorldClockHooks,
  unregisterWorldClockHooks,
} from "./worldClockHooks";

const updateWorldTime = (): void => renderPlanetClocks();

export function registerWorldClockModule(): void {
  applyCustomCalendarNames();
  registerWorldClockHooks();
  Hooks.on("updateWorldTime", updateWorldTime);
}

export function unregisterWorldClockModule(): void {
  restoreOriginalCalendarNames();
  unregisterWorldClockHooks();
  Hooks.off("updateWorldTime", updateWorldTime);
}

export { worldClockMacros } from "./macros";
