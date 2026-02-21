import { moduleId } from "../../constants";
import {
  registerWindowResizerHooks,
  unregisterWindowResizerHooks,
} from "./hooks/windowResizerHooks";
import {
  attachAppKeydownListener,
  detachAppKeydownListener,
  toggleActiveWindowSize,
} from "./utils/windowResizer";

const KEYBIND_ACTION = "toggleActiveWindowSize";
const KEY_CODE = "KeyE";
const KEY_MODIFIERS = ["Control", "Shift"] as const;

function onToggleRequest(): boolean {
  const resized = toggleActiveWindowSize();
  if (!resized) {
    ui.notifications.warn("No resizable active window.");
  }
  return resized;
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
  const bindings = game.keybindings.get(moduleId, KEYBIND_ACTION);
  console.log({ bindings });
  if (bindings.length > 0) {
    return bindings.map((binding) => ({
      key: binding.key,
      modifiers: [...binding.modifiers],
    }));
  }

  return [];
}

function isShortcut(event: KeyboardEvent): boolean {
  return getCurrentBindings().some((binding) =>
    keybindingMatchesEvent(event, binding),
  );
}

export function handleWindowResizerKeydown(event: KeyboardEvent): void {
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

export function registerWindowResizerModule(): void {
  registerWindowResizerKeybinding();
  registerWindowResizerHooks({
    onRender: (app) =>
      attachAppKeydownListener(app, handleWindowResizerKeydown),
    onClose: (app) => detachAppKeydownListener(app),
  });
}

export function unregisterWindowResizerModule(): void {
  unregisterWindowResizerHooks();
}
