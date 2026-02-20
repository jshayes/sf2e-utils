import { moduleId } from "../../../constants";
import { COMBAT_MANAGER_FLAG_KEY } from "../constants";
import { createCombat } from "../macros/createCombat";
import { open } from "../macros/open";
import { registerEnricher, unregisterEnricher } from "../../../enrichers/utils";

const pattern = /@StartCombat\[([^\]]+)\](?:\{([^}]+)\})?/g;
const clickSelector = "a.sf2e-start-combat";
let clickHandlerRegistered = false;

type CombatConfig = {
  name: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getCombatName(match: RegExpMatchArray): string {
  return String(match[1] ?? "").trim();
}

function getCombatDisplayLabel(match: RegExpMatchArray): string {
  const flavor = String(match[2] ?? "").trim();
  return flavor || getCombatName(match);
}

function getSceneCombats(scene: foundry.documents.Scene): CombatConfig[] {
  const raw = scene.getFlag(moduleId, COMBAT_MANAGER_FLAG_KEY);
  if (!Array.isArray(raw)) return [];

  return raw
    .filter(isRecord)
    .map((entry) => ({ name: String(entry.name ?? "").trim() }))
    .filter((entry) => entry.name.length > 0);
}

function hasCombatNamed(name: string, scene: foundry.documents.Scene): boolean {
  const normalized = name.trim().toLocaleLowerCase();
  return getSceneCombats(scene).some(
    (combat) => combat.name.trim().toLocaleLowerCase() === normalized,
  );
}

async function enricher(match: RegExpMatchArray): Promise<HTMLElement | null> {
  const name = getCombatName(match);
  if (!name) return null;
  const label = getCombatDisplayLabel(match);

  const element = document.createElement("span");
  element.classList.add("sf2e-start-combat");
  element.innerHTML = `<i class="fa-solid fa-swords"></i> ${foundry.utils.escapeHTML(label)} `;

  const view = document.createElement("a");
  view.classList.add("sf2e-start-combat");
  view.dataset.action = "view";
  view.dataset.combatName = name;
  view.innerHTML = "View";

  const start = document.createElement("a");
  start.classList.add("sf2e-start-combat");
  start.dataset.action = "start";
  start.dataset.combatName = name;
  start.innerHTML = "Start";

  element.appendChild(view);
  element.appendChild(start);
  return element;
}

async function onClick(event: MouseEvent): Promise<void> {
  const target = event.target as HTMLElement | null;
  const link = target?.closest(clickSelector);
  if (!(link instanceof HTMLAnchorElement)) return;

  event.preventDefault();

  const action = String(link.dataset.action ?? "");
  const combatName = String(link.dataset.combatName ?? "").trim();
  if (!combatName) return;

  const scene = game.scenes.current;
  if (!(scene instanceof foundry.documents.Scene)) {
    ui.notifications.warn("No active scene available.");
    return;
  }

  const exists = hasCombatNamed(combatName, scene);
  if (action === "view") {
    await open({ selectCombatName: exists ? combatName : undefined });
    return;
  }

  if (action === "start") {
    if (!exists) {
      ui.notifications.warn(`No saved combat named "${combatName}" was found.`);
      return;
    }
    await createCombat({ name: combatName });
  }
}

export function registerStartCombatEnricher(): void {
  registerEnricher({
    pattern,
    enricher,
  });

  if (!clickHandlerRegistered) {
    document.body.addEventListener("click", onClick);
    clickHandlerRegistered = true;
  }
}

export function unregisterStartCombatEnricher(): void {
  unregisterEnricher(pattern);

  if (clickHandlerRegistered) {
    document.body.removeEventListener("click", onClick);
    clickHandlerRegistered = false;
  }
}
