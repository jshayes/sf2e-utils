import {
  registerStartCombatEnricher,
  unregisterStartCombatEnricher,
} from "./enrichers/startCombatEnricher";
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
  registerStartCombatEnricher();
  registerCombatManagerHooks();
}

export function unregisterCombatManagerModule() {
  unregisterStartCombatEnricher();
  unregisterCombatManagerHooks();
}
