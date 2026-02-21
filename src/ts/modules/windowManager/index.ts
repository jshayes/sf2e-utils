import { moduleId } from "../../constants";
import {
  registerWindowManagerHooks,
  unregisterWindowManagerHooks,
} from "./hooks/windowManagerHooks";
import { open } from "./macros/open";
import { closeWindowSwitcher, isWindowSwitcherOpen } from "./popup/windowSwitcher";

const OPEN_WINDOW_SWITCHER_KEYBIND = "openWindowSwitcher";

export const windowManagerMacros = {
  open,
};

function registerWindowManagerKeybindings(): void {
  const keybindId = `${moduleId}.${OPEN_WINDOW_SWITCHER_KEYBIND}`;
  if (game.keybindings.actions.has(keybindId)) return;

  game.keybindings.register(moduleId, OPEN_WINDOW_SWITCHER_KEYBIND, {
    name: "Window Manager: Open Switcher",
    hint: "Open the quick window switcher popup.",
    editable: [{ key: "Space", modifiers: ["Control", "Shift"] }],
    onDown: () => {
      if (isWindowSwitcherOpen()) {
        closeWindowSwitcher();
      } else {
        void open();
      }
      return true;
    },
    precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL,
  });
}

export function registerWindowManagerModule(): void {
  registerWindowManagerKeybindings();
  registerWindowManagerHooks();
}

export function unregisterWindowManagerModule(): void {
  closeWindowSwitcher();
  unregisterWindowManagerHooks();
}
