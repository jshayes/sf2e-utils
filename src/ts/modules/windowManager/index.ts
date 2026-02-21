import {
  registerWindowManagerHooks,
  unregisterWindowManagerHooks,
} from "./hooks/windowManagerHooks";
import { open } from "./macros/open";

export const windowManagerMacros = {
  open,
};

export function registerWindowManagerModule(): void {
  registerWindowManagerHooks();
}

export function unregisterWindowManagerModule(): void {
  unregisterWindowManagerHooks();
}
