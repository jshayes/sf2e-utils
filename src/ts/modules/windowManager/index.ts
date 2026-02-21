import {
  registerWindowManagerHooks,
  unregisterWindowManagerHooks,
} from "./hooks/windowManagerHooks";
import { open } from "./macros/open";
import { closeWindowSwitcher } from "./popup/windowSwitcher";

export const windowManagerMacros = {
  open,
};

export function registerWindowManagerModule(): void {
  registerWindowManagerHooks();
}

export function unregisterWindowManagerModule(): void {
  closeWindowSwitcher();
  unregisterWindowManagerHooks();
}
