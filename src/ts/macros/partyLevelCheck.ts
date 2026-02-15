import { getPartyDC } from "../helpers";
import { createSkillCheckMessage } from "./createSkillCheckMessage";

type MacroScopeInput = {
  adjustment?: unknown;
};

type MacroScope = {
  adjustment?: string;
};

function parseAdjustment(value: string): number {
  const parsed = Number.parseInt(String(value ?? "").trim(), 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

type Rule<T> = (scope?: T) => string | void;

function validate<T>(rules: Rule<T>[], scope: T) {
  rules.forEach((rule) => {
    const message = rule(scope);
    if (message) {
      ui.notifications.error(message);
      throw new Error(message);
    }
  });
}

function validateScope(scope?: MacroScopeInput): asserts scope is MacroScope {
  validate(
    [
      (s) =>
        s?.adjustment && typeof s?.adjustment !== "string"
          ? `The adjustment must be a string, received ${typeof s?.adjustment} instead.`
          : undefined,
    ],
    scope,
  );
}

export async function partyLevelCheck(scope?: MacroScopeInput): Promise<void> {
  validateScope(scope);

  const adjustment = parseAdjustment(scope?.adjustment ?? "");
  const dc = getPartyDC() + adjustment;

  await createSkillCheckMessage({ dc });
}
