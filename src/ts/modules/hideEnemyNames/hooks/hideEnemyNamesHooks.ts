import type {
  ActorPF2e,
  ChatMessagePF2e,
  CombatantPF2e,
  EncounterPF2e,
  EncounterTracker,
  TokenDocumentPF2e,
} from "foundry-pf2e";
import { HooksManager } from "../../../helpers/hooks";
import { hideEnemyNamesIsEnabled } from "../settings";
import { getAnonymousActorLabel, getAnonymousCombatantLabel } from "../utils";

const hooks = new HooksManager();

function replaceNameAttributes(
  row: HTMLElement,
  originalName: string,
  anonymousLabel: string,
): void {
  const elements = row.querySelectorAll<HTMLElement>(
    "[alt], [aria-label], [title], [data-tooltip]",
  );
  for (const element of Array.from(elements)) {
    for (const attribute of ["alt", "aria-label", "title", "data-tooltip"]) {
      if (element.getAttribute(attribute)?.trim() === originalName) {
        element.setAttribute(attribute, anonymousLabel);
      }
    }
  }
}

function replaceCombatantName(
  row: HTMLElement,
  combatant: CombatantPF2e,
  anonymousLabel: string,
): void {
  const nameElement = row.querySelector<HTMLElement>(
    ".token-name [data-action='editName'], .token-name .name, " +
      ".token-name h4, .combatant-name, [data-role='combatant-name'], h4",
  );
  if (nameElement) nameElement.textContent = anonymousLabel;

  replaceNameAttributes(row, combatant.name, anonymousLabel);
}

function anonymizeEncounterTracker(
  app: EncounterTracker<EncounterPF2e | null>,
  html: HTMLElement,
): void {
  if (!hideEnemyNamesIsEnabled()) return;
  if (game.user.isGM) return;

  const combatants = app.viewed?.combatants;
  if (!combatants) return;

  const rows = html.querySelectorAll<HTMLElement>("[data-combatant-id]");
  for (const row of Array.from(rows)) {
    const combatant = combatants.get(row.dataset.combatantId ?? "");
    if (!combatant) continue;

    const anonymousLabel = getAnonymousCombatantLabel(combatant);
    if (!anonymousLabel) continue;
    replaceCombatantName(row, combatant, anonymousLabel);
  }
}

type AnonymousIdentity = {
  label: string;
  names: string[];
};

function getAnonymousIdentity(
  actor: ActorPF2e | null,
  token: TokenDocumentPF2e | null,
  additionalNames: string[] = [],
): AnonymousIdentity | null {
  const label = getAnonymousActorLabel(actor, token);
  if (!label) return null;

  const names = new Set(
    [actor?.name, token?.name, ...additionalNames]
      .map((name) => name?.trim())
      .filter((name): name is string => Boolean(name && name !== label)),
  );

  return names.size > 0 ? { label, names: Array.from(names) } : null;
}

function replaceIdentityInChatCard(
  html: HTMLElement,
  identity: AnonymousIdentity,
): void {
  const names = identity.names.sort((a, b) => b.length - a.length);
  const replaceNames = (text: string): string =>
    names.reduce(
      (result, name) => result.split(name).join(identity.label),
      text,
    );

  const walker = document.createTreeWalker(html, NodeFilter.SHOW_TEXT);
  let node: Node | null;
  while ((node = walker.nextNode())) {
    const text = node.nodeValue;
    if (text) node.nodeValue = replaceNames(text);
  }

  const elements = html.querySelectorAll<HTMLElement>(
    "[alt], [aria-label], [title], [data-tooltip]",
  );
  for (const element of Array.from(elements)) {
    for (const attribute of ["alt", "aria-label", "title", "data-tooltip"]) {
      const value = element.getAttribute(attribute);
      if (value) element.setAttribute(attribute, replaceNames(value));
    }
  }
}

function anonymizeChatMessage(
  message: ChatMessagePF2e,
  html: HTMLElement,
): void {
  if (!hideEnemyNamesIsEnabled()) return;
  if (game.user.isGM) return;

  const speaker = getAnonymousIdentity(message.actor, message.token, [
    message.speaker.alias ?? "",
  ]);
  const target = message.target
    ? getAnonymousIdentity(message.target.actor, message.target.token)
    : null;

  for (const identity of [speaker, target]) {
    if (identity) replaceIdentityInChatCard(html, identity);
  }
}

export function registerHideEnemyNamesHooks(): void {
  hooks.on("renderCombatTracker", anonymizeEncounterTracker);
  hooks.on("renderChatMessageHTML", anonymizeChatMessage);
}

export function unregisterHideEnemyNamesHooks(): void {
  hooks.off();
}
