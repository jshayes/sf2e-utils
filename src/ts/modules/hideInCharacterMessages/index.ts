import {
  registerHideInCharacterMessagesHooks,
  unregisterHideInCharacterMessagesHooks,
} from "./hooks/hideInCharacterMessagesHooks";

export function registerHideInCharacterMessagesModule(): void {
  registerHideInCharacterMessagesHooks();
}

export function unregisterHideInCharacterMessagesModule(): void {
  unregisterHideInCharacterMessagesHooks();
}
