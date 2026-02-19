import { createCombat } from "./macros/createCombat";
import {
  registerCombatManagerHooks,
  unregisterCombatManagerHooks,
} from "./hooks/combatManagerHooks";
import { open } from "./macros/open";

export const combatManagerMacros = {
  createCombat,
  open,
};

export function registerCombatManagerModule() {
  registerCombatManagerHooks();
}

export function unregisterCombatManagerModule() {
  unregisterCombatManagerHooks();
}
