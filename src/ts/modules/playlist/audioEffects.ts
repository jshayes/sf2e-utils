import type Sound from "foundry-pf2e/foundry/client/audio/sound.mjs";
import type { Playlist } from "foundry-pf2e/foundry/client/documents/_module.mjs";
import { moduleId } from "../../constants";
import { audioEffectsFlagKey } from "./constants";

export interface PlaylistAudioEffectsState {
  enabled: boolean;
  cutoffHz: number;
  amplifyDb: number;
  fadeMs: number;
}

export type SetPlaylistAudioEffectsInput = Partial<
  Omit<PlaylistAudioEffectsState, "enabled">
> & {
  enabled: boolean;
  playlistName?: string;
};

const defaultState: PlaylistAudioEffectsState = {
  enabled: false,
  cutoffHz: 150,
  amplifyDb: 10,
  fadeMs: 1_000,
};

const effectMarker = "__sf2eUtilsPlaylistEffect";
type EffectKind = "lowpass" | "amplifier";
type ManagedAudioNode = AudioNode & {
  [effectMarker]?: EffectKind;
};

const revisions = new WeakMap<Sound, number>();

function finiteNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}

export function normalizeAudioEffectsState(
  value: unknown,
): PlaylistAudioEffectsState {
  if (!value || typeof value !== "object") return { ...defaultState };

  const state = value as Partial<PlaylistAudioEffectsState>;
  return {
    enabled: state.enabled === true,
    cutoffHz: clamp(
      finiteNumber(state.cutoffHz, defaultState.cutoffHz),
      20,
      20_000,
    ),
    amplifyDb: clamp(
      finiteNumber(state.amplifyDb, defaultState.amplifyDb),
      -60,
      12,
    ),
    fadeMs: clamp(finiteNumber(state.fadeMs, defaultState.fadeMs), 0, 30_000),
  };
}

export function getPlaylistAudioEffectsState(
  playlist: Playlist,
): PlaylistAudioEffectsState {
  const state = playlist.getFlag(moduleId, audioEffectsFlagKey);
  return normalizeAudioEffectsState(state);
}

function getEffectKind(node: AudioNode): EffectKind | undefined {
  return (node as ManagedAudioNode)[effectMarker];
}

function markEffect<TNode extends AudioNode>(
  node: TNode,
  kind: EffectKind,
): TNode {
  (node as ManagedAudioNode)[effectMarker] = kind;
  return node;
}

function nextRevision(sound: Sound): number {
  const revision = (revisions.get(sound) ?? 0) + 1;
  revisions.set(sound, revision);
  return revision;
}

function dbToGain(db: number): number {
  return 10 ** (db / 20);
}

function rampAudioParam(
  parameter: AudioParam,
  target: number,
  now: number,
  durationMs: number,
): void {
  const current = Math.max(parameter.value, 0.0001);
  const positiveTarget = Math.max(target, 0.0001);

  // Always establish an explicit starting event. In particular, this avoids a
  // browser interpreting a new ramp relative to an earlier completed ramp.
  parameter.cancelScheduledValues(now);
  parameter.setValueAtTime(current, now);

  if (durationMs === 0) {
    parameter.setValueAtTime(positiveTarget, now);
    return;
  }

  parameter.exponentialRampToValueAtTime(
    positiveTarget,
    now + durationMs / 1_000,
  );
}

function findLowPass(sound: Sound): BiquadFilterNode | undefined {
  return sound.effects.find(
    (node): node is BiquadFilterNode => getEffectKind(node) === "lowpass",
  );
}

function findAmplifier(sound: Sound): GainNode | undefined {
  return sound.effects.find(
    (node): node is GainNode => getEffectKind(node) === "amplifier",
  );
}

function removeManagedEffects(sound: Sound): void {
  const removed = sound.effects.filter((node) => getEffectKind(node));
  if (removed.length === 0) return;

  sound.applyEffects(sound.effects.filter((node) => !getEffectKind(node)));
  removed.forEach((node) => node.disconnect());
}

async function wait(durationMs: number): Promise<void> {
  if (durationMs === 0) return;
  await new Promise<void>((resolve) => window.setTimeout(resolve, durationMs));
}

export async function applyEnabledEffects(
  sound: Sound,
  state: PlaylistAudioEffectsState,
): Promise<void> {
  const context = sound.context;
  const openFrequency = context.sampleRate / 2;
  const cutoffHz = Math.min(state.cutoffHz, openFrequency);

  const lowPass =
    findLowPass(sound) ?? markEffect(context.createBiquadFilter(), "lowpass");
  const amplifier =
    findAmplifier(sound) ?? markEffect(context.createGain(), "amplifier");

  lowPass.type = "lowpass";
  lowPass.Q.value = 1;

  if (!sound.effects.includes(lowPass)) {
    lowPass.frequency.value = openFrequency;
  }
  if (!sound.effects.includes(amplifier)) {
    amplifier.gain.value = 1;
  }

  const unmanagedEffects = sound.effects.filter((node) => !getEffectKind(node));
  sound.applyEffects([...unmanagedEffects, lowPass, amplifier]);

  nextRevision(sound);
  const now = context.currentTime;
  rampAudioParam(lowPass.frequency, cutoffHz, now, state.fadeMs);
  rampAudioParam(amplifier.gain, dbToGain(state.amplifyDb), now, state.fadeMs);
}

export async function applyDisabledEffects(
  sound: Sound,
  fadeMs: number,
): Promise<void> {
  const lowPass = findLowPass(sound);
  const amplifier = findAmplifier(sound);
  if (!lowPass && !amplifier) return;

  const revision = nextRevision(sound);
  const now = sound.context.currentTime;

  if (lowPass) {
    rampAudioParam(
      lowPass.frequency,
      sound.context.sampleRate / 2,
      now,
      fadeMs,
    );
  }
  if (amplifier) rampAudioParam(amplifier.gain, 1, now, fadeMs);

  await wait(fadeMs);
  if (revisions.get(sound) !== revision) return;
  removeManagedEffects(sound);
}

export async function applyPlaylistAudioEffects(
  playlist: Playlist,
  state = getPlaylistAudioEffectsState(playlist),
): Promise<void> {
  await Promise.all(
    playlist.sounds.map(async (playlistSound) => {
      if (!playlistSound.playing) {
        if (playlistSound.sound) {
          await applyDisabledEffects(playlistSound.sound, 0);
        }
        return;
      }

      if (!state.enabled && !playlistSound.sound) return;

      if (!playlistSound.sound) await playlistSound.load();
      const sound = playlistSound.sound;
      if (!sound) return;

      if (state.enabled) {
        await applyEnabledEffects(sound, state);
      } else {
        await applyDisabledEffects(sound, state.fadeMs);
      }
    }),
  );
}

export function removeAllLocalPlaylistAudioEffects(): void {
  for (const playlist of game.playlists) {
    for (const playlistSound of playlist.sounds) {
      const sound = playlistSound.sound;
      if (!sound) continue;

      nextRevision(sound);
      removeManagedEffects(sound);
    }
  }
}
