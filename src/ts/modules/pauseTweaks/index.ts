import {
  registerPauseTweaksHooks,
  unregisterPauseTweaksHooks,
} from "./hooks/pauseTweaksHooks";

export function registerPauseTweaksModule(): void {
  registerPauseTweaksHooks();
}

export function unregisterPauseTweaksModule(): void {
  unregisterPauseTweaksHooks();
}

