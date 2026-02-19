import {
  registerRollResolverHooks,
  unregisterRollResolverHooks,
} from "./hooks/rollResolverHooks";

export function registerRollResolverModule() {
  registerRollResolverHooks();
}

export function unregisterRollResolverModule() {
  unregisterRollResolverHooks();
}
