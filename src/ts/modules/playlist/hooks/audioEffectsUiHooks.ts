import type { Playlist } from "foundry-pf2e/foundry/client/documents/_module.mjs";
import { moduleId } from "../../../constants";
import { HooksManager } from "../../../helpers/hooks";
import {
  getPlaylistAudioEffectsState,
  normalizeAudioEffectsState,
  PlaylistAudioEffectsState,
} from "../audioEffects";
import { audioEffectsFlagKey } from "../constants";

const hooks = new HooksManager();
const toggleClass = "sf2e-utils-audio-effect-toggle";
const controlsClass = "sf2e-utils-audio-effect-controls";
const configClass = "sf2e-utils-audio-effects-config";
const flagPath = `flags.${moduleId}.${audioEffectsFlagKey}`;

type PlaylistConfigApplication = {
  document: Playlist;
  element?: HTMLElement | null;
  form?: HTMLFormElement | null;
};

function getRoot(element: unknown): HTMLElement | null {
  if (element instanceof HTMLElement) return element;
  if (typeof element === "object" && element !== null && "0" in element) {
    const first = (element as { 0?: unknown })[0];
    if (first instanceof HTMLElement) return first;
  }
  return null;
}

function createNumberField({
  label,
  name,
  value,
  min,
  max,
  step,
}: {
  label: string;
  name: string;
  value: number;
  min: number;
  max: number;
  step: number;
}): HTMLDivElement {
  const group = document.createElement("div");
  group.className = "form-group";

  const labelElement = document.createElement("label");
  labelElement.textContent = label;

  const fields = document.createElement("div");
  fields.className = "form-fields";

  const input = document.createElement("input");
  input.type = "number";
  input.name = name;
  input.value = String(value);
  input.min = String(min);
  input.max = String(max);
  input.step = String(step);
  input.dataset.dtype = "Number";

  fields.append(input);
  group.append(labelElement, fields);
  return group;
}

function createEnabledField(enabled: boolean): HTMLDivElement {
  const group = document.createElement("div");
  group.className = "form-group";

  const label = document.createElement("label");
  label.textContent = "Enabled";

  const fields = document.createElement("div");
  fields.className = "form-fields";

  const input = document.createElement("input");
  input.type = "checkbox";
  input.name = `${flagPath}.enabled`;
  input.checked = enabled;
  input.dataset.dtype = "Boolean";

  fields.append(input);
  group.append(label, fields);
  return group;
}

function injectPlaylistConfig(
  application: PlaylistConfigApplication,
  element: unknown,
): void {
  if (!game.user.isGM) return;

  const root = getRoot(element) ?? application.element ?? null;
  const form = application.form ?? root?.querySelector("form") ?? null;
  if (!form || form.querySelector(`.${configClass}`)) return;

  const state =
    getPlaylistAudioEffectsState(application.document) ??
    normalizeAudioEffectsState(undefined);

  const fieldset = document.createElement("fieldset");
  fieldset.className = configClass;

  const legend = document.createElement("legend");
  legend.textContent = "SF2E Utils Audio Effects";

  fieldset.append(
    legend,
    createEnabledField(state.enabled),
    createNumberField({
      label: "Low-pass cutoff (Hz)",
      name: `${flagPath}.cutoffHz`,
      value: state.cutoffHz,
      min: 20,
      max: 20_000,
      step: 10,
    }),
    createNumberField({
      label: "Amplification (dB)",
      name: `${flagPath}.amplifyDb`,
      value: state.amplifyDb,
      min: -60,
      max: 12,
      step: 0.5,
    }),
    createNumberField({
      label: "Effect fade (ms)",
      name: `${flagPath}.fadeMs`,
      value: state.fadeMs,
      min: 0,
      max: 30_000,
      step: 100,
    }),
  );

  const footer = form.querySelector(":scope > footer, .form-footer");
  if (footer) footer.before(fieldset);
  else form.append(fieldset);
}

function findPlaylistEntries(
  root: HTMLElement,
  playlistId: string,
): HTMLElement[] {
  const escapedId = CSS.escape(playlistId);
  const playlistEntrySelector = `[data-entry-id="${escapedId}"]`;
  const playlistReferenceSelector = `[data-playlist-id="${escapedId}"]`;
  const entries = new Set<HTMLElement>();

  const playlistEntries = Array.from(
    root.querySelectorAll<HTMLElement>(playlistEntrySelector),
  );
  if (root.matches(playlistEntrySelector)) playlistEntries.unshift(root);
  playlistEntries.forEach((entry) => entries.add(entry));

  const playlistReferences = Array.from(
    root.querySelectorAll<HTMLElement>(playlistReferenceSelector),
  );
  if (root.matches(playlistReferenceSelector)) playlistReferences.unshift(root);

  for (const reference of playlistReferences) {
    // A normal expanded playlist contains track rows with data-playlist-id.
    // Ignore those descendants, but retain the separately-rendered copy in
    // Foundry's currently-playing widget.
    if (playlistEntries.some((entry) => entry.contains(reference))) continue;
    entries.add(reference);
  }

  return Array.from(entries);
}

function updateToggleAppearance(
  button: HTMLButtonElement,
  state: PlaylistAudioEffectsState,
): void {
  button.classList.toggle("active", state.enabled);
  button.setAttribute("aria-pressed", String(state.enabled));
  const action = state.enabled ? "Disable" : "Enable";
  const label = `${action} playlist audio effect`;
  button.title = label;
  button.setAttribute("aria-label", label);
}

function createPlaylistToggle(playlist: Playlist): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `inline-control sound-control icon fa-solid fa-filter ${toggleClass}`;
  button.dataset.playlistId = playlist.id;

  updateToggleAppearance(
    button,
    getPlaylistAudioEffectsState(playlist) ??
      normalizeAudioEffectsState(undefined),
  );

  button.addEventListener("click", async (event) => {
    event.preventDefault();
    event.stopPropagation();

    const current =
      getPlaylistAudioEffectsState(playlist) ??
      normalizeAudioEffectsState(undefined);
    button.disabled = true;

    try {
      const next = { ...current, enabled: !current.enabled };
      await playlist.setFlag(moduleId, audioEffectsFlagKey, next);
      document
        .querySelectorAll<HTMLButtonElement>(
          `.${toggleClass}[data-playlist-id="${CSS.escape(playlist.id)}"]`,
        )
        .forEach((toggle) => updateToggleAppearance(toggle, next));
    } finally {
      button.disabled = false;
    }
  });

  return button;
}

function injectPlaylistToggles(element: unknown): void {
  if (!game.user.isGM) return;

  const root = getRoot(element);
  if (!root) return;

  for (const playlist of game.playlists) {
    const entries = findPlaylistEntries(root, playlist.id);

    for (const entry of entries) {
      if (entry.querySelector(`.${toggleClass}`)) continue;

      const header =
        entry.querySelector<HTMLElement>(":scope > .playlist-header") ??
        entry.querySelector<HTMLElement>(".playlist-header") ??
        entry.querySelector<HTMLElement>(":scope > .sound-header") ??
        entry.querySelector<HTMLElement>(".sound-header") ??
        entry.querySelector<HTMLElement>(":scope > header") ??
        entry.querySelector<HTMLElement>(":scope > .entry-header");
      const nativeSoundControl = entry.querySelector<HTMLElement>(
        `.sound-control:not(.${toggleClass})`,
      );
      const controls =
        header?.querySelector<HTMLElement>(".playlist-controls") ??
        entry.querySelector<HTMLElement>(".sound-controls") ??
        entry.querySelector<HTMLElement>(".playlist-sound-controls") ??
        entry.querySelector<HTMLElement>(".entry-controls") ??
        nativeSoundControl?.parentElement ??
        header ??
        entry;

      if (controls.classList.contains("sound-controls")) {
        controls.classList.add(controlsClass);
      }
      controls.append(createPlaylistToggle(playlist));
    }
  }
}

export function registerAudioEffectsUiHooks(): void {
  hooks.on("renderPlaylistDirectory", (_application, element) => {
    injectPlaylistToggles(element);
  });

  hooks.on(
    "renderPlaylistConfig",
    (application: PlaylistConfigApplication, element) => {
      injectPlaylistConfig(application, element);
    },
  );
}

export function unregisterAudioEffectsUiHooks(): void {
  hooks.off();
  document
    .querySelectorAll(`.${toggleClass}, .${configClass}`)
    .forEach((element) => element.remove());
}
