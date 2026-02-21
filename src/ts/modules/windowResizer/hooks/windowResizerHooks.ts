import { HooksManager } from "../../../helpers/hooks";
import {
  attachResizeHeaderButton,
  clearWindowSizeState,
} from "../utils/windowResizer";

const hooks = new HooksManager();

export function registerWindowResizerHooks(): void {
  hooks.on("renderApplicationV2", (app: unknown) => {
    attachResizeHeaderButton(app);
  });

  hooks.on("renderApplication", (app: unknown) => {
    attachResizeHeaderButton(app);
  });

  hooks.on("closeApplicationV2", (app: unknown) => {
    clearWindowSizeState(app);
  });

  hooks.on("closeApplication", (app: unknown) => {
    clearWindowSizeState(app);
  });
}

export function unregisterWindowResizerHooks(): void {
  hooks.off();
}

