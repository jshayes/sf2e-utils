import { registerPartyLevelDcEnricher } from "./partyLevelDc";
import { registerSkillCheckPromptEnricher } from "./skillCheckPrompt";

export function registerEnrichers(): void {
  registerPartyLevelDcEnricher();
  registerSkillCheckPromptEnricher();
}
