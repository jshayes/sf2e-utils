import { HooksManager } from "../../../helpers/hooks";
import {
  attachResizeHeaderButton,
  clearWindowSizeState,
} from "../utils/windowResizer";

const hooks = new HooksManager();

type WindowResizerHookHandlers = {
  onRender: (app: unknown) => void;
  onClose: (app: unknown) => void;
};

export function registerWindowResizerHooks(handlers: WindowResizerHookHandlers): void {
  hooks.on("renderApplicationV2", (app: unknown) => {
    attachResizeHeaderButton(app);
    handlers.onRender(app);
  });

  hooks.on("renderApplication", (app: unknown) => {
    attachResizeHeaderButton(app);
    handlers.onRender(app);
  });

  hooks.on("closeApplicationV2", (app: unknown) => {
    handlers.onClose(app);
    clearWindowSizeState(app);
  });

  hooks.on("closeApplication", (app: unknown) => {
    handlers.onClose(app);
    clearWindowSizeState(app);
  });
}

export function unregisterWindowResizerHooks(): void {
  hooks.off();
}
