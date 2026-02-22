import { EncounterPF2e } from "foundry-pf2e";
import { moduleId } from "../../../constants";
import {
  getCurrentDiceRollSetting,
  setDiceRollsTo,
  setDiceRollsToDefault,
} from "../../../macros/toggleDice";
import {
  COMBAT_MANAGER_COMBAT_FLAG_KEY,
  COMBAT_MANAGER_FLAG_KEY,
} from "../constants";
import { HooksManager } from "../../../helpers/hooks";

type CombatantEntry = {
  id: string;
  round: number;
  enabled: boolean;
};

type CombatEntry = {
  name: string;
  combatants: CombatantEntry[];
  combatId: string | null;
};

const hooks = new HooksManager();

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
      ? Math.max(1, Math.floor(roundValue))
      : 1;
  const enabled = typeof value.enabled === "boolean" ? value.enabled : true;
  return { id, round, enabled };
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
      combatant.enabled &&
      combatant.round <= round &&
      !existingTokenIds.has(combatant.id),
  );
}

async function addPendingCombatantsAndRoll(
  combat: foundry.documents.Combat,
  scene: foundry.documents.Scene,
  pending: CombatantEntry[],
): Promise<number> {
  const pendingIds = new Set(pending.map((entry) => entry.id));
  const tokenDocuments = scene.tokens.filter((token) =>
    pendingIds.has(token.id),
  );
  if (!tokenDocuments.length) return 0;

  const createdCombatants = await combat.createEmbeddedDocuments(
    "Combatant",
    tokenDocuments.map((token) => ({
      tokenId: token.id,
      sceneId: scene.id,
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

function getSourceSceneForCombat(
  combat: foundry.documents.Combat,
): foundry.documents.Scene | null {
  const sourceSceneId = combat.getFlag(moduleId, COMBAT_MANAGER_COMBAT_FLAG_KEY);
  if (typeof sourceSceneId === "string" && sourceSceneId.trim().length > 0) {
    return game.scenes?.get(sourceSceneId) ?? null;
  }
  return combat.scene instanceof foundry.documents.Scene ? combat.scene : null;
}

const allowNextRoundAdvance = new Set<string>();
const processingRoundAdvance = new Set<string>();

export function registerCombatManagerHooks(): void {
  hooks.on("preUpdateCombat", (combat, changed: Record<string, unknown>) => {
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

    const currentScene = getSourceSceneForCombat(combatDoc);
    if (!currentScene) return;

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
          currentScene,
          pending,
        );
        if (addedCount > 0) {
          ui.notifications.info(
            `Added ${addedCount} delayed combatant(s) to "${config.name}" for round ${targetRound}.`,
          );
        }

        // Allow this one follow-up advance to proceed without interception.
        allowNextRoundAdvance.add(combatDoc.id);
        await combatDoc.nextRound();
      } finally {
        processingRoundAdvance.delete(combatDoc.id);
      }
    })();

    // Prevent the current round advance; we'll re-run it after joiners are added.
    return false;
  });
}

export function unregisterCombatManagerHooks(): void {
  hooks.off();
  allowNextRoundAdvance.clear();
  processingRoundAdvance.clear();
}
