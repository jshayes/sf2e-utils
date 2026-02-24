import { ActorPF2e, TokenPF2e } from "foundry-pf2e";

function getPartyMembers() {
  return game.actors.party?.members ?? [];
}

function getPartyLevel(members: ActorPF2e[]) {
  if (!members.length) return 0;
  const partyLevels = members.map((x) => x.level);
  return Math.round(
    partyLevels.reduce((sum, level) => sum + level, 0) / partyLevels.length,
  );
}

export function getCombatXP(combatants: TokenPF2e[]) {
  const partyMembers = getPartyMembers();
  const partyMemberIds = partyMembers.map((x) => x.id);

  const partyCombatants = [];
  const nonPartyCombatants = [];

  for (const combatant of combatants) {
    if (!combatant.actor) continue;

    if (partyMemberIds.includes(combatant.actor.id)) {
      partyCombatants.push(combatant.actor);
    } else {
      nonPartyCombatants.push(combatant.actor);
    }
  }

  return game.pf2e.gm.calculateXP(
    getPartyLevel(partyCombatants),
    partyCombatants.length,
    nonPartyCombatants.map((x) => x.level),
    [],
    {},
  );
}
