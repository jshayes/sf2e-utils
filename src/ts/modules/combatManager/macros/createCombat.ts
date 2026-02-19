import { EncounterPF2e } from "foundry-pf2e";
import { moduleId } from "../../../constants";
import { validate } from "../../../helpers/validation";
import { COMBAT_MANAGER_FLAG_KEY } from "../constants";
import {
  getCurrentDiceRollSetting,
  setDiceRollsTo,
  setDiceRollsToDefault,
} from "../../../macros/toggleDice";

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

type Input = {
  name: string;
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

function getSceneCombats(scene: foundry.documents.Scene): CombatEntry[] {
  const raw = scene.getFlag(moduleId, COMBAT_MANAGER_FLAG_KEY);
  if (!Array.isArray(raw)) return [];

  return raw
    .map(coerceCombat)
    .filter((combat): combat is CombatEntry => combat !== null);
}

function getCombatByName(
  combats: CombatEntry[],
  name: string,
): { combat: CombatEntry; index: number } | null {
  const normalized = name.trim().toLocaleLowerCase();
  const index = combats.findIndex(
    (combat) => combat.name.trim().toLocaleLowerCase() === normalized,
  );
  if (index < 0) return null;
  const combat = combats[index];
  if (!combat) return null;
  return { combat, index };
}

function getTokenDocumentsByCombatants(
  scene: foundry.documents.Scene,
  combatants: CombatantEntry[],
): foundry.documents.TokenDocument[] {
  const tokenIds = new Set(combatants.map((combatant) => combatant.id));
  return scene.tokens.filter((token) => tokenIds.has(token.id));
}

function validateInput(name: Input): asserts name is Input {
  validate(
    [
      (scope) => ({
        condition: typeof scope?.name !== "string",
        message: `Combat name must be a string, received: ${typeof scope}`,
      }),
      (scope) => ({
        condition:
          typeof scope?.name === "string" && scope?.name.trim().length === 0,
        message: "Combat name cannot be empty.",
      }),
    ],
    name,
  );
}

function getExistingAssociatedCombat(
  scene: foundry.documents.Scene,
  combat: CombatEntry,
): foundry.documents.Combat | null {
  if (!combat.combatId) return null;
  const existing = game.combats?.get(combat.combatId);
  if (!existing) return null;
  if (existing.scene?.id !== scene.id) return null;
  return existing;
}

async function saveSceneCombats(
  scene: foundry.documents.Scene,
  combats: CombatEntry[],
): Promise<void> {
  await scene.setFlag(moduleId, COMBAT_MANAGER_FLAG_KEY, combats);
}

export async function createCombat(input: Input): Promise<void> {
  validateInput(input);

  const scene = game.scenes.current;
  if (!scene) {
    ui.notifications.warn("No active scene available.");
    return;
  }

  const combats = getSceneCombats(scene);
  const entry = getCombatByName(combats, input.name);
  if (!entry) {
    ui.notifications.warn(`No saved combat named "${input.name}" was found.`);
    return;
  }
  const { combat, index } = entry;

  const existingCombat = getExistingAssociatedCombat(scene, combat);
  if (existingCombat) {
    await existingCombat.activate();
    ui.notifications.info(`Activated existing combat "${combat.name}".`);
    return;
  }

  const joiningNow = combat.combatants.filter(
    (combatant) => combatant.enabled && combatant.round <= 0,
  );
  const tokenDocuments = getTokenDocumentsByCombatants(scene, joiningNow);
  if (tokenDocuments.length === 0) {
    ui.notifications.warn(
      `No tokens were found on the scene for combat "${combat.name}".`,
    );
    return;
  }

  const createdCombat = await foundry.documents.Combat.create({
    scene: scene.id,
  });
  if (!createdCombat || Array.isArray(createdCombat)) {
    ui.notifications.error("Failed to create combat encounter.");
    return;
  }

  await createdCombat.createEmbeddedDocuments(
    "Combatant",
    tokenDocuments.map((token) => ({
      tokenId: token.id,
      actorId: token.actor?.id ?? null,
      hidden: Boolean(token.hidden),
    })),
  );
  await createdCombat.activate();

  const setting = getCurrentDiceRollSetting();
  await setDiceRollsToDefault({ diceTypes: ["d20"], silent: true });
  try {
    await (createdCombat as EncounterPF2e).rollNPC({
      skipDialog: true,
    });
  } finally {
    if (setting) {
      await setDiceRollsTo(setting, { diceTypes: ["d20"], silent: true });
    }
  }

  const updatedCombat = combats[index];
  if (updatedCombat) {
    updatedCombat.combatId = createdCombat.id;
    await saveSceneCombats(scene, combats);
  }

  ui.notifications.info(
    `Created and activated combat "${combat.name}" with ${tokenDocuments.length} combatants, then rolled NPC initiative.`,
  );
}
