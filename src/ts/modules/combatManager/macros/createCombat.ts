import { moduleId } from "../../../constants";
import { validate } from "../../../helpers/validation";
import { COMBAT_MANAGER_FLAG_KEY } from "../constants";

type CombatantEntry = {
  id: string;
};

type CombatEntry = {
  name: string;
  combatants: CombatantEntry[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function coerceCombatant(value: unknown): CombatantEntry | null {
  if (!isRecord(value)) return null;
  const id = value.id;
  if (typeof id !== "string" || id.trim().length === 0) return null;
  return { id };
}

function coerceCombat(value: unknown): CombatEntry | null {
  if (!isRecord(value)) return null;
  const name = value.name;
  if (typeof name !== "string") return null;

  const combatants = (Array.isArray(value.combatants) ? value.combatants : [])
    .map(coerceCombatant)
    .filter((combatant): combatant is CombatantEntry => combatant !== null);

  return { name, combatants };
}

function getSceneCombats(scene: foundry.documents.Scene): CombatEntry[] {
  const raw = scene.getFlag(moduleId, COMBAT_MANAGER_FLAG_KEY);
  if (!Array.isArray(raw)) return [];

  return raw
    .map(coerceCombat)
    .filter((combat): combat is CombatEntry => combat !== null);
}

function getCombatByName(combats: CombatEntry[], name: string): CombatEntry | null {
  const normalized = name.trim().toLocaleLowerCase();
  return (
    combats.find(
      (combat) => combat.name.trim().toLocaleLowerCase() === normalized,
    ) ?? null
  );
}

function getTokenDocumentsByCombatants(
  scene: foundry.documents.Scene,
  combatants: CombatantEntry[],
): foundry.documents.TokenDocument[] {
  const tokenIds = new Set(combatants.map((combatant) => combatant.id));
  return scene.tokens.filter((token) => tokenIds.has(token.id));
}

function validateInput(name: unknown): asserts name is string {
  validate(
    [
      (scope) => ({
        condition: typeof scope !== "string",
        message: `Combat name must be a string, received: ${typeof scope}`,
      }),
      (scope) => ({
        condition: typeof scope === "string" && scope.trim().length === 0,
        message: "Combat name cannot be empty.",
      }),
    ],
    name,
  );
}

export async function createCombat(name: string): Promise<void> {
  validateInput(name);

  const scene = game.scenes.current;
  if (!scene) {
    ui.notifications.warn("No active scene available.");
    return;
  }

  const combats = getSceneCombats(scene);
  const combat = getCombatByName(combats, name);
  if (!combat) {
    ui.notifications.warn(`No saved combat named "${name}" was found.`);
    return;
  }

  const tokenDocuments = getTokenDocumentsByCombatants(scene, combat.combatants);
  if (tokenDocuments.length === 0) {
    ui.notifications.warn(`No tokens were found on the scene for combat "${combat.name}".`);
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

  ui.notifications.info(
    `Created and activated combat "${combat.name}" with ${tokenDocuments.length} combatants.`,
  );
}
