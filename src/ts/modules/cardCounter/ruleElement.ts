export const cardCounterRuleKey = "SF2EUtilsCardCounter";

type CardsType = "deck" | "hand";

function getCardsChoices(type: CardsType): Record<string, string> {
  const cardStacks = (
    game as typeof game & { cards?: Collection<string, Cards> }
  ).cards;
  const stacks = cardStacks?.filter((stack) => stack.type === type) ?? [];

  return Object.fromEntries(
    stacks
      .sort((left, right) => left.name.localeCompare(right.name))
      .flatMap((stack) =>
        stack.uuid ? [[stack.uuid, stack.name] as const] : [],
      ),
  );
}

export function getDefaultCardsUuid(type: CardsType): string | undefined {
  return Object.keys(getCardsChoices(type)).at(0);
}

type RuleElementConstructor =
  (typeof game.pf2e.RuleElements.custom)[string];

export function createCardCounterRuleElement(): RuleElementConstructor {
  const BaseRuleElement = game.pf2e.RuleElement;

  class CardCounterRuleElement extends BaseRuleElement {
    static override autogenForms = true;

    static override defineSchema() {
      const fields = foundry.data.fields;

      return {
        ...super.defineSchema(),
        handUuid: new fields.StringField({
        required: true,
        nullable: false,
        blank: false,
        initial: () => getDefaultCardsUuid("hand") ?? "",
        choices: () => getCardsChoices("hand"),
          label: "SF2E_UTILS.CardCounter.Hand.Label",
          hint: "SF2E_UTILS.CardCounter.Hand.Hint",
        }),
        deckUuid: new fields.StringField({
        required: true,
        nullable: false,
        blank: false,
        initial: () => getDefaultCardsUuid("deck") ?? "",
        choices: () => getCardsChoices("deck"),
          label: "SF2E_UTILS.CardCounter.Deck.Label",
          hint: "SF2E_UTILS.CardCounter.Deck.Hint",
        }),
      };
    }
  }

  return CardCounterRuleElement as unknown as RuleElementConstructor;
}
