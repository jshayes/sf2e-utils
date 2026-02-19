import {
  registerDiceSoNiceHooks as registerBaseDiceSoNiceHooks,
  unregisterDiceSoNiceHooks as unregisterBaseDiceSoNiceHooks,
} from "./diceSoNiceHooks";
import {
  registerGhostDiceHooks,
  unregisterGhostDiceHooks,
} from "./ghostDiceHooks";

export function registerDiceSoNiceHooks() {
  registerBaseDiceSoNiceHooks();
  registerGhostDiceHooks();
}

export function unregisterDiceSoNiceHooks() {
  unregisterBaseDiceSoNiceHooks();
  unregisterGhostDiceHooks();
}
