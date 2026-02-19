import { CombatManagerApp } from "../applications/combatManagerApp";

export async function open(): Promise<void> {
  await new CombatManagerApp().render({ force: true });
}
