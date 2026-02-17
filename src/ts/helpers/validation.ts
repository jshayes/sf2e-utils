interface RuleResult {
  condition: boolean;
  message: string;
}
type Rule<T> = (scope: T) => RuleResult;

export function validate<T>(rules: Rule<T>[], scope: T) {
  rules.forEach((rule) => {
    const { condition, message } = rule(scope);
    if (condition) {
      ui.notifications.error(message);
      throw new Error(message);
    }
  });
}
