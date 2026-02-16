import {
  registerActivateSceneEnricher,
  unregisterActivateSceneEnricher,
} from "./activateScene";
import {
  registerPartyLevelDcEnricher,
  unregisterPartyLevelDcEnricher,
} from "./partyLevelDc";
import {
  registerRunMacroEnricher,
  unregisterRunMacroEnricher,
} from "./runMacro";
import {
  registerSkillCheckPromptEnricher,
  unregisterSkillCheckPromptEnricher,
} from "./skillCheckPrompt";

export function registerEnrichers(): void {
  registerActivateSceneEnricher();
  registerRunMacroEnricher();
  registerPartyLevelDcEnricher();
  registerSkillCheckPromptEnricher();
}

export function unregisterEnrichers() {
  unregisterActivateSceneEnricher();
  unregisterRunMacroEnricher();
  unregisterPartyLevelDcEnricher();
  unregisterSkillCheckPromptEnricher();
}
