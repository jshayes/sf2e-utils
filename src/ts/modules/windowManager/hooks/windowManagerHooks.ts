import { HooksManager } from "../../../helpers/hooks";
import { windowRegistry, type WindowManagerApp } from "../state/windowRegistry";

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

function isApplicationV2(app: unknown): app is foundry.applications.api.ApplicationV2 {
  return app instanceof foundry.applications.api.ApplicationV2;
}

function isApplicationV1(app: unknown): app is foundry.appv1.api.Application {
  return app instanceof foundry.appv1.api.Application;
}

function shouldTrackWindow(app: WindowManagerApp): boolean {
  // Restrict to framed "window-like" apps (sheets, dialogs, popouts) for V2.
  if (isApplicationV2(app) && !app.hasFrame) return false;

  const id = String(app.id ?? "")
    .trim()
    .toLocaleLowerCase();
  if (EXCLUDED_WINDOW_IDS.has(id)) return false;

  return true;
}

export function registerWindowManagerHooks(): void {
  hooks.on("renderApplicationV2", (app: unknown) => {
    console.log("renderApplicationV2", app);
    if (!isApplicationV2(app)) return;
    if (!shouldTrackWindow(app)) return;
    windowRegistry.upsert(app);
  });

  hooks.on("closeApplicationV2", (app: unknown) => {
    if (!isApplicationV2(app)) return;
    if (!shouldTrackWindow(app)) return;
    windowRegistry.remove(app);
  });

  hooks.on("renderApplication", (app: unknown) => {
    console.log("renderApplication", app);
    if (!isApplicationV1(app)) return;
    if (!shouldTrackWindow(app)) return;
    windowRegistry.upsert(app);
  });

  hooks.on("closeApplication", (app: unknown) => {
    if (!isApplicationV1(app)) return;
    if (!shouldTrackWindow(app)) return;
    windowRegistry.remove(app);
  });
}

export function unregisterWindowManagerHooks(): void {
  hooks.off();
}
