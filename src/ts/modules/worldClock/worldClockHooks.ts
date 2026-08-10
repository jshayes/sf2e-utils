import { openPlanetClockList } from "./planetClocksApp";

const OPEN_PLANET_CLOCKS_ACTION = "openPlanetClocks";

function addPlanetClockHeaderControl(
  application: foundry.applications.api.ApplicationV2,
  controls: fa.ApplicationHeaderControlsEntry[],
): void {
  if (application !== game.pf2e.worldClock) return;
  if (controls.some((control) => control.action === OPEN_PLANET_CLOCKS_ACTION)) {
    return;
  }

  controls.push({
    action: OPEN_PLANET_CLOCKS_ACTION,
    icon: "fa-solid fa-globe",
    label: "Planet Clocks",
    onClick: () => void openPlanetClockList(),
  });
}

export function registerWorldClockHooks(): void {
  Hooks.on("getHeaderControlsApplicationV2", addPlanetClockHeaderControl);
}

export function unregisterWorldClockHooks(): void {
  Hooks.off("getHeaderControlsApplicationV2", addPlanetClockHeaderControl);
}

