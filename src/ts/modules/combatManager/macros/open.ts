import { CombatManagerApp } from "../applications/combatManagerApp";

type OpenInput = {
  selectCombatName?: string;
};

export async function open(input: OpenInput = {}): Promise<void> {
  await new CombatManagerApp({
    selectCombatName: input.selectCombatName,
  }).render({ force: true });
}
