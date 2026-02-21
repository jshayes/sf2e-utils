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
const TOGGLE_SWITCHER_KEY = "Space";
const TOGGLE_SWITCHER_MODIFIERS = ["Control", "Shift"] as const;
let isGlobalToggleListenerRegistered = false;

export const windowManagerMacros = {
  open,
};

function toggleWindowSwitcher(): void {
  if (isWindowSwitcherOpen()) {
    closeWindowSwitcher();
  } else {
    open();
  }
}

function isToggleShortcut(event: KeyboardEvent): boolean {
  if (event.code !== TOGGLE_SWITCHER_KEY) return false;
  if (!event.ctrlKey || !event.shiftKey) return false;
  if (event.altKey || event.metaKey) return false;
  return true;
}

function onGlobalToggleShortcut(event: KeyboardEvent): void {
  if (!isToggleShortcut(event)) return;
  if (event.repeat) return;
  event.preventDefault();
  event.stopPropagation();
  toggleWindowSwitcher();
}

function registerWindowManagerKeybindings(): void {
  const keybindId = `${moduleId}.${OPEN_WINDOW_SWITCHER_KEYBIND}`;
  const onDown = () => {
    toggleWindowSwitcher();
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
    editable: [{ key: TOGGLE_SWITCHER_KEY, modifiers: [...TOGGLE_SWITCHER_MODIFIERS] }],
    onDown,
    precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL,
  });
}

function registerGlobalToggleListener(): void {
  if (isGlobalToggleListenerRegistered) return;
  document.addEventListener("keydown", onGlobalToggleShortcut, true);
  isGlobalToggleListenerRegistered = true;
}

function unregisterGlobalToggleListener(): void {
  if (!isGlobalToggleListenerRegistered) return;
  document.removeEventListener("keydown", onGlobalToggleShortcut, true);
  isGlobalToggleListenerRegistered = false;
}

export function registerWindowManagerModule(): void {
  registerWindowManagerKeybindings();
  registerGlobalToggleListener();
  registerWindowManagerHooks();
}

export function unregisterWindowManagerModule(): void {
  unregisterGlobalToggleListener();
  closeWindowSwitcher();
  unregisterWindowManagerHooks();
}
