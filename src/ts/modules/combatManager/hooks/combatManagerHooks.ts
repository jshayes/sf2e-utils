import { EncounterPF2e } from "foundry-pf2e";
import { moduleId } from "../../../constants";
import {
  getCurrentDiceRollSetting,
  setDiceRollsTo,
  setDiceRollsToDefault,
} from "../../../macros/toggleDice";
import { COMBAT_MANAGER_FLAG_KEY } from "../constants";

type CombatantEntry = {
  id: string;
  round: number;
};

type CombatEntry = {
  name: string;
  combatants: CombatantEntry[];
  combatId: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function coerceCombatant(value: unknown): CombatantEntry | null {
  if (!isRecord(value)) return null;
  const id = value.id;
  if (typeof id !== "string" || id.trim().length === 0) return null;
  const roundValue = value.round;
  const round =
    typeof roundValue === "number" && Number.isFinite(roundValue)
      ? Math.max(0, Math.floor(roundValue))
      : 0;
  return { id, round };
}

function coerceCombat(value: unknown): CombatEntry | null {
  if (!isRecord(value)) return null;
  const name = value.name;
  if (typeof name !== "string") return null;

  const combatants = (Array.isArray(value.combatants) ? value.combatants : [])
    .map(coerceCombatant)
    .filter((combatant): combatant is CombatantEntry => combatant !== null);
  const combatId = typeof value.combatId === "string" ? value.combatId : null;

  return { name, combatants, combatId };
}

function getSceneCombats(scene: foundry.documents.BaseScene): CombatEntry[] {
  const raw = scene.getFlag(moduleId, COMBAT_MANAGER_FLAG_KEY);
  if (!Array.isArray(raw)) return [];
  return raw
    .map(coerceCombat)
    .filter((combat): combat is CombatEntry => combat !== null);
}

function getPendingCombatantsForRound(
  combat: foundry.documents.Combat,
  config: CombatEntry,
  round: number,
): CombatantEntry[] {
  const existingTokenIds = new Set(
    combat.combatants.contents
      .map((combatant) => String(combatant.tokenId ?? "").trim())
      .filter((id) => id.length > 0),
  );

  return config.combatants.filter(
    (combatant) =>
      combatant.round > 0 &&
      combatant.round <= round &&
      !existingTokenIds.has(combatant.id),
  );
}

async function addPendingCombatantsAndRoll(
  combat: foundry.documents.Combat,
  pending: CombatantEntry[],
): Promise<number> {
  const scene = combat.scene;
  if (!(scene instanceof foundry.documents.Scene)) return 0;

  const pendingIds = new Set(pending.map((entry) => entry.id));
  const tokenDocuments = scene.tokens.filter((token) =>
    pendingIds.has(token.id),
  );
  if (!tokenDocuments.length) return 0;

  const createdCombatants = await combat.createEmbeddedDocuments(
    "Combatant",
    tokenDocuments.map((token) => ({
      tokenId: token.id,
      actorId: token.actorId ?? null,
      hidden: Boolean(token.hidden),
    })),
  );

  const createdIds = createdCombatants
    .map((combatant) => combatant.id)
    .filter((id): id is string => typeof id === "string" && id.length > 0);
  if (!createdIds.length) return 0;

  const setting = getCurrentDiceRollSetting();
  await setDiceRollsToDefault({ diceTypes: ["d20"], silent: true });
  try {
    await (combat as EncounterPF2e).rollInitiative(createdIds, {
      skipDialog: true,
    });
  } finally {
    if (setting) {
      await setDiceRollsTo(setting, { diceTypes: ["d20"], silent: true });
    }
  }

  return createdIds.length;
}

let preUpdateCombatHook: number;
const allowNextRoundAdvance = new Set<string>();
const processingRoundAdvance = new Set<string>();
const processingTurnSkips = new Set<string>();

// Keep references so the alternate implementation remains in this file for comparison.
void getPendingCombatantsForRound;
void addPendingCombatantsAndRoll;

export function registerCombatManagerHooks(): void {
  preUpdateCombatHook = Hooks.on(
    "preUpdateCombat",
    (combat, changed: Record<string, unknown>) => {
      const combatDoc = combat as foundry.documents.Combat;

      if (!game.user.isGM) return;

      if (allowNextRoundAdvance.has(combatDoc.id)) {
        allowNextRoundAdvance.delete(combatDoc.id);
        return;
      }

      const currentRound = combatDoc.round;
      const nextRoundValue = changed.round as number | null | undefined;
      const targetRound = Number(nextRoundValue);
      if (!Number.isFinite(targetRound)) return;
      if (targetRound <= currentRound) return;

      const scene = combatDoc.scene;
      if (!scene) return;
      const currentScene = scene;

      const config = getSceneCombats(currentScene).find(
        (entry) => entry.combatId === combatDoc.id,
      );
      if (config === undefined) return;

      const pending = getPendingCombatantsForRound(
        combatDoc,
        config,
        targetRound,
      );
      if (!pending.length) return;

      if (processingRoundAdvance.has(combatDoc.id)) return false;
      processingRoundAdvance.add(combatDoc.id);

      void (async () => {
        try {
          const addedCount = await addPendingCombatantsAndRoll(
            combatDoc,
            pending,
          );
          if (addedCount > 0) {
            ui.notifications.info(
              `Added ${addedCount} delayed combatant(s) to "${config.name}" for round ${targetRound}.`,
            );
          }

          // Allow this one follow-up advance to proceed without interception.
          allowNextRoundAdvance.add(combatDoc.id);
          console.log("next");
          await combatDoc.nextRound();
        } finally {
          processingRoundAdvance.delete(combatDoc.id);
        }
      })();

      // Prevent the current round advance; we'll re-run it after joiners are added.
      return false;
    },
  );
}

export function unregisterCombatManagerHooks(): void {
  Hooks.off("preUpdateCombat", preUpdateCombatHook);
  allowNextRoundAdvance.clear();
  processingRoundAdvance.clear();
  processingTurnSkips.clear();
}
