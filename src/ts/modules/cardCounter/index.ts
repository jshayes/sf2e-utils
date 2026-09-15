import {
  cardCounterRuleKey,
  createCardCounterRuleElement,
} from "./ruleElement";
import {
  registerCardCounterSynchronizer,
  unregisterCardCounterSynchronizer,
} from "./synchronizer";
import {
  registerCardCounterDefaults,
  unregisterCardCounterDefaults,
} from "./defaults";

type RuleElementConstructor =
  (typeof game.pf2e.RuleElements.custom)[string];
type RuleElementRegistry = Record<string, RuleElementConstructor>;

let cardCounterRuleElement: RuleElementConstructor | undefined;

function getCustomRuleElements(): RuleElementRegistry | null {
  const pf2e = game.pf2e;
  return pf2e?.RuleElements.custom ?? null;
}

export function registerCardCounterModule(): void {
  const customRuleElements = getCustomRuleElements();
  if (!customRuleElements) {
    console.warn(
      "SF2E Utils | PF2e rule elements are unavailable; card counters were not registered",
    );
    return;
  }

  cardCounterRuleElement = createCardCounterRuleElement();
  customRuleElements[cardCounterRuleKey] = cardCounterRuleElement;
  registerCardCounterDefaults();
  registerCardCounterSynchronizer();
}

export function unregisterCardCounterModule(): void {
  unregisterCardCounterSynchronizer();
  unregisterCardCounterDefaults();

  const customRuleElements = getCustomRuleElements();
  if (
    cardCounterRuleElement &&
    customRuleElements?.[cardCounterRuleKey] === cardCounterRuleElement
  ) {
    delete customRuleElements[cardCounterRuleKey];
  }
  cardCounterRuleElement = undefined;
}
