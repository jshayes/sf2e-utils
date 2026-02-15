import { registerPartyLevelDcEnricher } from "./partyLevelDc";
import { registerRunMacroEnricher } from "./runMacro";
import { registerSkillCheckPromptEnricher } from "./skillCheckPrompt";

export function registerEnrichers(): void {
  registerRunMacroEnricher();
  registerPartyLevelDcEnricher();
  registerSkillCheckPromptEnricher();
}
