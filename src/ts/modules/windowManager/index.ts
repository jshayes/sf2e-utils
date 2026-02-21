import { moduleId } from "../../constants";
import {
  registerWindowManagerHooks,
  unregisterWindowManagerHooks,
} from "./hooks/windowManagerHooks";
import { open } from "./macros/open";
import {
  closeWindowSwitcher,
  isWindowSwitcherOpen,
} from "./popup/windowSwitcher";

const OPEN_WINDOW_SWITCHER_KEYBIND = "openWindowSwitcher";

export const windowManagerMacros = {
  open,
};

function registerWindowManagerKeybindings(): void {
  const keybindId = `${moduleId}.${OPEN_WINDOW_SWITCHER_KEYBIND}`;
  const onDown = () => {
    if (isWindowSwitcherOpen()) {
      closeWindowSwitcher();
    } else {
      open();
    }
    return true;
  };

  const existingAction = game.keybindings.actions.get(keybindId);
  if (existingAction) {
    // During HMR, the action map can persist stale callbacks in internal key maps.
    existingAction.onDown = onDown;
    game.keybindings.initialize();
    return;
  }

  game.keybindings.register(moduleId, OPEN_WINDOW_SWITCHER_KEYBIND, {
    name: "Window Manager: Open Switcher",
    hint: "Open the quick window switcher popup.",
    editable: [{ key: "Space", modifiers: ["Control", "Shift"] }],
    onDown,
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
