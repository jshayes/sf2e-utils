import type { ActorPF2e, ItemPF2e } from "foundry-pf2e";
import { HooksManager } from "../../helpers/hooks";
import {
  cardCounterRuleKey,
  getDefaultCardsUuid,
} from "./ruleElement";

type RuleSource = Record<string, JSONValue> & {
  key?: JSONValue;
  handUuid?: JSONValue;
  deckUuid?: JSONValue;
};

const hooks = new HooksManager();
const defaultsUpdateOption = "sf2eUtilsCardCounterDefaults";

function hasValue(value: JSONValue | undefined): value is string {
  return typeof value === "string" && value.length > 0;
}

async function addMissingDefaults(item: ItemPF2e): Promise<void> {
  if (!item.isOfType("effect")) return;

  const rules = item.toObject().system.rules as RuleSource[];
  const handUuid = getDefaultCardsUuid("hand");
  const deckUuid = getDefaultCardsUuid("deck");
  let changed = false;

  for (const rule of rules) {
    if (rule.key !== cardCounterRuleKey) continue;

    if (!hasValue(rule.handUuid) && handUuid) {
      rule.handUuid = handUuid;
      changed = true;
    }
    if (!hasValue(rule.deckUuid) && deckUuid) {
      rule.deckUuid = deckUuid;
      changed = true;
    }
  }

  if (!changed) return;

  const updateOptions = {
    [defaultsUpdateOption]: true,
  } as Parameters<typeof item.update>[1] & Record<string, unknown>;
  await item.update({ "system.rules": rules }, updateOptions);
}

function getActors(): ActorPF2e[] {
  const actors = new Map<string, ActorPF2e>();
  for (const actor of game.actors) actors.set(actor.uuid, actor);
  for (const token of canvas.scene?.tokens ?? []) {
    if (token.actor) actors.set(token.actor.uuid, token.actor);
  }
  return Array.from(actors.values());
}

async function repairExistingRules(): Promise<void> {
  if (!game.user.isGM) return;

  const items = [
    ...game.items,
    ...getActors().flatMap((actor) => actor.items.contents),
  ];
  for (const item of items) {
    await addMissingDefaults(item);
  }
}

function updateDefaults(item: ItemPF2e, options: Record<string, unknown>): void {
  if (!game.user.isGM || options[defaultsUpdateOption]) return;
  void addMissingDefaults(item).catch((error: unknown) => {
    console.error(
      `SF2E Utils | Failed to add Card Hand Counter defaults to ${item.uuid}`,
      error,
    );
  });
}

export function registerCardCounterDefaults(): void {
  hooks.once("ready", () => void repairExistingRules());
  hooks.on(
    "createItem",
    (item: ItemPF2e, options: Record<string, unknown>) =>
      updateDefaults(item, options),
  );
  hooks.on(
    "updateItem",
    (item: ItemPF2e, _changed, options: Record<string, unknown>) =>
      updateDefaults(item, options),
  );

  if (game.ready) void repairExistingRules();
}

export function unregisterCardCounterDefaults(): void {
  hooks.off();
}

