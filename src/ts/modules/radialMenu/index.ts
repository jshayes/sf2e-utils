import { moduleId } from "../../constants";
import {
  openRadialMenuApp,
  closeRadialMenuApp,
} from "./applications/radialMenuApp";
import {
  closeRadialMenuEditorApp,
  openRadialMenuEditorApp,
  RadialMenuEditorApplication,
} from "./applications/radialMenuEditorApp";
import { open } from "./macros/open";
import { openEditor } from "./macros/openEditor";

export const radialMenuMacros = {
  open,
  openEditor,
};

const OPEN_RADIAL_MENU_KEYBIND = "open-radial-menu";
const RADIAL_MENU_EDITOR_SETTINGS_MENU = "radial-menu-editor";
let isRadialMenuKeyListenerRegistered = false;

function matchesBinding(
  event: KeyboardEvent,
  binding: { key: string | null; modifiers?: string[] },
): boolean {
  if (!binding.key) return false;
  if (event.code !== binding.key) return false;

  return true;
}

function shouldCloseForKeyup(event: KeyboardEvent): boolean {
  const bindings = game.keybindings.get(moduleId, OPEN_RADIAL_MENU_KEYBIND);
  return bindings.some((binding) => matchesBinding(event, binding));
}

function registerRadialMenuKeyupListener(): void {
  if (isRadialMenuKeyListenerRegistered) return;

  document.addEventListener(
    "keyup",
    (event) => {
      if (!shouldCloseForKeyup(event)) return;
      closeRadialMenuApp();
    },
    true,
  );
  window.addEventListener("blur", () => {
    closeRadialMenuApp();
  });

  isRadialMenuKeyListenerRegistered = true;
}

function registerRadialMenuKeybinding(): void {
  const keybindId = `${moduleId}.${OPEN_RADIAL_MENU_KEYBIND}`;
  const onDown = () => {
    openRadialMenuApp();
    return true;
  };

  const existingAction = game.keybindings.actions.get(keybindId);
  if (existingAction) {
    existingAction.onDown = onDown;
    game.keybindings.initialize();
    return;
  }

  game.keybindings.register(moduleId, OPEN_RADIAL_MENU_KEYBIND, {
    name: "Open Radial Menu",
    hint: "Hold this key to open the radial menu and release it to close.",
    editable: [],
    onDown,
    precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL,
  });
}

function registerRadialMenuSettingsMenu(): void {
  game.settings.registerMenu(moduleId, RADIAL_MENU_EDITOR_SETTINGS_MENU, {
    name: "Configure Radial Menu",
    label: "Open Editor",
    hint: "Open the radial menu editor.",
    icon: "fa-solid fa-compass-drafting",
    type: RadialMenuEditorApplication,
    restricted: false,
  });
}

export function registerRadialMenuModule(): void {
  registerRadialMenuSettingsMenu();
  registerRadialMenuKeybinding();
  registerRadialMenuKeyupListener();
}

export function unregisterRadialMenuModule(): void {
  closeRadialMenuApp();
  void closeRadialMenuEditorApp();
}

export { openRadialMenuEditorApp };
