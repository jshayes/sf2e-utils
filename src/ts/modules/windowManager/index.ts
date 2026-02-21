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

function eventModifierPressed(event: KeyboardEvent, modifier: string): boolean {
  switch (modifier.toLowerCase()) {
    case "control":
    case "ctrl":
      return event.ctrlKey;
    case "shift":
      return event.shiftKey;
    case "alt":
      return event.altKey;
    case "meta":
      return event.metaKey;
    default:
      return false;
  }
}

function keybindingMatchesEvent(
  event: KeyboardEvent,
  binding: { key: string | null; modifiers: string[] },
): boolean {
  if (!binding.key || event.code !== binding.key) return false;

  const required = new Set(binding.modifiers.map((m) => m.toLowerCase()));
  const allModifiers = ["control", "shift", "alt", "meta"];
  for (const modifier of allModifiers) {
    const isRequired = required.has(modifier);
    const isPressed = eventModifierPressed(event, modifier);
    if (isRequired !== isPressed) return false;
  }
  return true;
}

function getCurrentBindings(): Array<{
  key: string | null;
  modifiers: string[];
}> {
  const bindings = game.keybindings.get(moduleId, OPEN_WINDOW_SWITCHER_KEYBIND);
  if (bindings.length > 0) {
    return bindings.map((binding) => ({
      key: binding.key,
      modifiers: [...binding.modifiers],
    }));
  }

  return [];
}

function isToggleShortcut(event: KeyboardEvent): boolean {
  return getCurrentBindings().some((binding) =>
    keybindingMatchesEvent(event, binding),
  );
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
    editable: [
      { key: TOGGLE_SWITCHER_KEY, modifiers: [...TOGGLE_SWITCHER_MODIFIERS] },
    ],
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
