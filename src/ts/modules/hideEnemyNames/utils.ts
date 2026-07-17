import type {
  ActorPF2e,
  CombatantPF2e,
  TokenDocumentPF2e,
} from "foundry-pf2e";

function localizeConfigLabel(label: string | undefined): string | null {
  if (!label) return null;
  return game.i18n.localize(label);
}

/**
 * Build the anonymous label shown for a hostile creature. Returning null
 * leaves the creature's normal name unchanged.
 */
export function getAnonymousActorLabel(
  actor: ActorPF2e | null,
  token: TokenDocumentPF2e | null,
): string | null {
  if (!actor?.isOfType("creature") || actor.hasPlayerOwner) return null;

  const isHostile = token
    ? token.disposition === CONST.TOKEN_DISPOSITIONS.HOSTILE
    : actor.alliance === "opposition";
  if (!isHostile) {
    return null;
  }

  const size = localizeConfigLabel(CONFIG.PF2E.actorSizes[actor.size]);
  const creatureType = actor.creatureTypes[0];
  const trait = creatureType
    ? localizeConfigLabel(CONFIG.PF2E.creatureTypes[creatureType])
    : null;

  if (!size) return trait;
  if (!trait) return size;
  return `${size} ${trait}`;
}

export function getAnonymousCombatantLabel(
  combatant: CombatantPF2e,
): string | null {
  return getAnonymousActorLabel(combatant.actor, combatant.token);
}
