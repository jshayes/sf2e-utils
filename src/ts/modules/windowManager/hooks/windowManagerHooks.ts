import { HooksManager } from "../../../helpers/hooks";
import { windowRegistry } from "../state/windowRegistry";

const hooks = new HooksManager();

const EXCLUDED_WINDOW_IDS = new Set([
  "hotbar",
  "pause",
  "sidebar",
  "navigation",
  "scene-controls",
  "players",
  "menu",
]);

function shouldTrackWindow(app: foundry.applications.api.ApplicationV2): boolean {
  // Restrict to framed "window-like" apps (sheets, dialogs, popouts).
  if (!app.hasFrame) return false;

  const id = String(app.id ?? "").trim().toLocaleLowerCase();
  if (EXCLUDED_WINDOW_IDS.has(id)) return false;

  return true;
}

export function registerWindowManagerHooks(): void {
  hooks.on("renderApplicationV2", (app) => {
    if (!(app instanceof foundry.applications.api.ApplicationV2)) return;
    if (!shouldTrackWindow(app)) return;
    windowRegistry.upsert(app);
  });

  hooks.on("closeApplicationV2", (app) => {
    if (!(app instanceof foundry.applications.api.ApplicationV2)) return;
    if (!shouldTrackWindow(app)) return;
    windowRegistry.remove(app);
  });
}

export function unregisterWindowManagerHooks(): void {
  hooks.off();
}
