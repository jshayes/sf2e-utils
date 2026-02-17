import { NumberTrackerApp } from "../applications/numberTrackerApp";
import { validate } from "./validation";

type TrackerInput = {
  name?: string;
};

function validateInput(input: TrackerInput): asserts input is TrackerInput {
  validate(
    [
      (scope) => ({
        condition: Boolean(scope.name && typeof scope.name !== "string"),
        message: `The name property must be a string, received: ${typeof scope.name}`,
      }),
    ],
    input,
  );
}

export async function numberTracker2(input: TrackerInput = {}): Promise<void> {
  validateInput(input);
  await new NumberTrackerApp({ name: input.name }).render({ force: true });
}
