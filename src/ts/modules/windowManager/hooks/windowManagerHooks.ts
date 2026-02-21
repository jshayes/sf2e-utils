import { HooksManager } from "../../../helpers/hooks";
import { moduleId } from "../../../constants";
import { windowRegistry } from "../state/windowRegistry";

const hooks = new HooksManager();

function isWindowManagerApp(
  app: foundry.applications.api.ApplicationV2,
): boolean {
  return String(app.id ?? "") === `${moduleId}-window-manager`;
}

export function registerWindowManagerHooks(): void {
  hooks.on("renderApplicationV2", (app) => {
    console.log("renderApplicationV2");
    if (!(app instanceof foundry.applications.api.ApplicationV2)) return;
    if (isWindowManagerApp(app)) return;
    console.log(app);
    windowRegistry.upsert(app);
  });

  hooks.on("closeApplicationV2", (app) => {
    if (!(app instanceof foundry.applications.api.ApplicationV2)) return;
    if (isWindowManagerApp(app)) return;
    windowRegistry.remove(app);
  });
}

export function unregisterWindowManagerHooks(): void {
  hooks.off();
}
