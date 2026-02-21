import { moduleId } from "../../constants";
import {
  registerWindowResizerHooks,
  unregisterWindowResizerHooks,
} from "./hooks/windowResizerHooks";
import { toggleActiveWindowSize } from "./utils/windowResizer";

const KEYBIND_ACTION = "toggleActiveWindowSize";
const KEY_CODE = "KeyE";
const KEY_MODIFIERS = ["Control", "Shift"] as const;
let isGlobalListenerRegistered = false;

function onToggleRequest(): boolean {
  const resized = toggleActiveWindowSize();
  if (!resized) {
    ui.notifications.warn("No resizable active window.");
  }
  return resized;
}

function isShortcut(event: KeyboardEvent): boolean {
  if (event.code !== KEY_CODE) return false;
  if (!event.ctrlKey || !event.shiftKey) return false;
  if (event.altKey || event.metaKey) return false;
  return true;
}

function onGlobalKeyDown(event: KeyboardEvent): void {
  if (!isShortcut(event)) return;
  if (event.repeat) return;
  event.preventDefault();
  event.stopPropagation();
  onToggleRequest();
}

function registerWindowResizerKeybinding(): void {
  const keybindId = `${moduleId}.${KEYBIND_ACTION}`;
  const onDown = () => onToggleRequest();

  const existingAction = game.keybindings.actions.get(keybindId);
  if (existingAction) {
    existingAction.onDown = onDown;
    game.keybindings.initialize();
    return;
  }

  game.keybindings.register(moduleId, KEYBIND_ACTION, {
    name: "Resize Active Window",
    hint: "Toggle the active window between expanded and original size.",
    editable: [{ key: KEY_CODE, modifiers: [...KEY_MODIFIERS] }],
    onDown,
    precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL,
  });
}

function registerGlobalKeyListener(): void {
  if (isGlobalListenerRegistered) return;
  document.addEventListener("keydown", onGlobalKeyDown, true);
  isGlobalListenerRegistered = true;
}

function unregisterGlobalKeyListener(): void {
  if (!isGlobalListenerRegistered) return;
  document.removeEventListener("keydown", onGlobalKeyDown, true);
  isGlobalListenerRegistered = false;
}

export function registerWindowResizerModule(): void {
  registerWindowResizerKeybinding();
  registerGlobalKeyListener();
  registerWindowResizerHooks();
}

export function unregisterWindowResizerModule(): void {
  unregisterGlobalKeyListener();
  unregisterWindowResizerHooks();
}

