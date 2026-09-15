import type { ActorPF2e, EffectPF2e, ItemPF2e } from "foundry-pf2e";
import { HooksManager } from "../../helpers/hooks";
import { cardCounterRuleKey } from "./ruleElement";

type CardCounterRuleSource = {
  key: string;
  handUuid?: unknown;
  deckUuid?: unknown;
  ignored?: unknown;
};

type CardCounterConfiguration = {
  handUuid: string;
  deckUuid: string;
};

type OwnedEffect = EffectPF2e<ActorPF2e>;
type CardsDocument = {
  documentName: "Cards";
  id: string;
  uuid: string;
  type: "deck" | "hand" | "pile";
  cards: {
    contents: {
      source: Cards | null;
      _source: { origin: string | null };
    }[];
  };
};

const hooks = new HooksManager();
const warningKeys = new Set<string>();
const syncUpdateOption = "sf2eUtilsCardCounterSync";
const debounceMilliseconds = 100;

let syncTimer: number | undefined;
let syncInProgress = false;
let syncAgain = false;

function isResponsibleGM(): boolean {
  return game.user.isGM;
}

function getConfiguration(effect: EffectPF2e): CardCounterConfiguration | null {
  const rules = effect.toObject().system.rules as CardCounterRuleSource[];
  const rule = rules.find(
    (candidate) =>
      candidate.key === cardCounterRuleKey && candidate.ignored !== true,
  );

  if (
    !rule ||
    typeof rule.handUuid !== "string" ||
    typeof rule.deckUuid !== "string" ||
    !rule.handUuid ||
    !rule.deckUuid
  ) {
    return null;
  }

  return { handUuid: rule.handUuid, deckUuid: rule.deckUuid };
}

function getActors(): ActorPF2e[] {
  const actors = new Map<string, ActorPF2e>();

  for (const actor of game.actors) {
    actors.set(actor.uuid, actor);
  }

  for (const token of canvas.scene?.tokens ?? []) {
    const actor = token.actor;
    if (actor) actors.set(actor.uuid, actor);
  }

  return Array.from(actors.values());
}

function getConfiguredEffects(): OwnedEffect[] {
  const effects: OwnedEffect[] = [];
  for (const actor of getActors()) {
    for (const item of actor.items) {
      if (item.isOfType("effect") && getConfiguration(item)) {
        effects.push(item);
      }
    }
  }

  return effects;
}

function warnOnce(effect: OwnedEffect, message: string): void {
  const key = `${effect.uuid}:${message}`;
  if (warningKeys.has(key)) return;

  warningKeys.add(key);
  console.warn(`SF2E Utils | Card counter on ${effect.uuid}: ${message}`);
}

function isCardsDocument(document: unknown): document is CardsDocument {
  return (
    document instanceof foundry.abstract.Document &&
    document.documentName === "Cards"
  );
}

async function synchronizeEffect(effect: OwnedEffect): Promise<void> {
  const configuration = getConfiguration(effect);
  if (!configuration) return;

  const hand = await fromUuid(configuration.handUuid);
  if (!isCardsDocument(hand) || hand.type !== "hand") {
    warnOnce(
      effect,
      `Hand UUID ${configuration.handUuid} could not be resolved`,
    );
    return;
  }

  const deck = await fromUuid(configuration.deckUuid);
  if (!isCardsDocument(deck) || deck.type !== "deck") {
    warnOnce(
      effect,
      `Deck UUID ${configuration.deckUuid} could not be resolved`,
    );
    return;
  }

  const count = hand.cards.contents.filter((card) => {
    return card.source?.uuid === deck.uuid || card._source.origin === deck.id;
  }).length;
  const badge = effect.system.badge;

  if (
    badge?.type === "counter" &&
    badge.value === count &&
    badge.min === 0 &&
    badge.max === Infinity &&
    !badge.loop
  ) {
    return;
  }

  const updateOptions = {
    [syncUpdateOption]: true,
  } as Parameters<typeof effect.update>[1] & Record<string, unknown>;

  await effect.update(
    {
      "system.badge": {
        type: "counter",
        value: count,
        min: 0,
        max: null,
        loop: false,
        labels: null,
      },
    },
    updateOptions,
  );
}

async function synchronizeAll(): Promise<void> {
  if (!isResponsibleGM()) return;

  if (syncInProgress) {
    syncAgain = true;
    return;
  }

  syncInProgress = true;
  try {
    do {
      syncAgain = false;
      for (const effect of getConfiguredEffects()) {
        try {
          await synchronizeEffect(effect);
        } catch (error) {
          console.error(
            `SF2E Utils | Failed to synchronize card counter ${effect.uuid}`,
            error,
          );
        }
      }
    } while (syncAgain);
  } finally {
    syncInProgress = false;
  }
}

function scheduleSynchronization(): void {
  if (!isResponsibleGM()) return;

  if (syncTimer !== undefined) window.clearTimeout(syncTimer);
  syncTimer = window.setTimeout(() => {
    syncTimer = undefined;
    void synchronizeAll();
  }, debounceMilliseconds);
}

function itemHasCardCounter(item: ItemPF2e): boolean {
  return item.isOfType("effect") && getConfiguration(item) !== null;
}

export function registerCardCounterSynchronizer(): void {
  hooks.once("ready", scheduleSynchronization);
  hooks.on("canvasReady", scheduleSynchronization);

  for (const hook of ["createCard", "updateCard", "deleteCard"] as const) {
    hooks.on(hook, scheduleSynchronization);
  }

  hooks.on("createItem", (item: ItemPF2e) => {
    if (itemHasCardCounter(item)) scheduleSynchronization();
  });

  hooks.on(
    "updateItem",
    (item: ItemPF2e, _changed, options: Record<string, unknown>) => {
      if (options[syncUpdateOption]) return;
      if (itemHasCardCounter(item)) scheduleSynchronization();
    },
  );

  hooks.on("updateUser", scheduleSynchronization);

  if (game.ready) scheduleSynchronization();
}

export function unregisterCardCounterSynchronizer(): void {
  hooks.off();
  if (syncTimer !== undefined) window.clearTimeout(syncTimer);
  syncTimer = undefined;
  syncAgain = false;
}
