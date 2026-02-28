import {
  closeRadialMenuApp,
} from "./applications/radialMenuApp";
import { open } from "./macros/open";

export const radialMenuMacros = {
  open,
};

export function registerRadialMenuModule(): void {
  // No startup hooks yet; boilerplate app opens through macro/API.
}

export function unregisterRadialMenuModule(): void {
  closeRadialMenuApp();
}
