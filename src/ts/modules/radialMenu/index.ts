import {
  closeRadialMenuApp,
} from "./applications/radialMenuApp";
import {
  closeRadialMenuEditorApp,
  openRadialMenuEditorApp,
} from "./applications/radialMenuEditorApp";
import { open } from "./macros/open";
import { openEditor } from "./macros/openEditor";

export const radialMenuMacros = {
  open,
  openEditor,
};

export function registerRadialMenuModule(): void {
  // No startup hooks yet; boilerplate app opens through macro/API.
}

export function unregisterRadialMenuModule(): void {
  closeRadialMenuApp();
  void closeRadialMenuEditorApp();
}

export { openRadialMenuEditorApp };
