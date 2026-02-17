import { moduleId } from "../constants";
import { validate } from "./validation";

const FLAG_KEY = "number-tracker-state";

type TrackerEntry = {
  name: string;
  value: number;
};

type TrackerState = {
  trackers: TrackerEntry[];
};

type TrackerInput = {
  name?: string;
};

function parseInteger(value: unknown, fallback = 0): number {
  const text = String(value ?? "").trim();
  if (!/^[+-]?\d+$/.test(text)) return fallback;
  return Number.parseInt(text, 10);
}

function coerceTrackerEntry(value: unknown): TrackerEntry {
  const tracker = value as Partial<TrackerEntry> | null | undefined;
  return {
    name: typeof tracker?.name === "string" ? tracker.name : "",
    value: parseInteger(tracker?.value, 0),
  };
}

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

export async function numberTracker(input: TrackerInput = {}): Promise<void> {
  validateInput(input);

  const flagKey = `${FLAG_KEY}.${input.name ?? "default"}`;

  const savedState = game.user.getFlag(moduleId, flagKey) as
    | TrackerState
    | undefined;
  const initialTrackers =
    Array.isArray(savedState?.trackers) && savedState.trackers.length
      ? savedState.trackers.map(coerceTrackerEntry)
      : [{ name: "", value: 0 }];

  await foundry.applications.api.DialogV2.wait({
    window: { title: `Number Tracker${input.name ? `: ${input.name}` : ""}` },
    form: { closeOnSubmit: false },
    content: `
      <div data-tracker-list></div>
    `,
    render: (event: Event, dialog: { element?: HTMLElement | null }) => {
      console.log({ event });
      const root = dialog.element;
      if (!root) return;

      const trackerList = root.querySelector("[data-tracker-list]");
      const addButton = root.querySelector('button[data-action="addTracker"]');
      if (!(trackerList instanceof HTMLElement)) return;
      if (!(addButton instanceof HTMLButtonElement)) return;

      const getStateFromDom = (): TrackerState => {
        const trackers = Array.from(
          trackerList.querySelectorAll(".tracker-entry"),
        ).map((entry) => {
          const nameInput = entry.querySelector('input[name="trackerName"]');
          const valueInput = entry.querySelector('input[name="trackerValue"]');

          return {
            name:
              nameInput instanceof HTMLInputElement
                ? nameInput.value.trim()
                : "",
            value:
              valueInput instanceof HTMLInputElement
                ? parseInteger(valueInput.value, 0)
                : 0,
          };
        });

        return { trackers };
      };

      const saveState = async (): Promise<void> => {
        await game.user.setFlag(moduleId, flagKey, getStateFromDom());
      };

      const addTrackerEntry = (
        tracker: TrackerEntry = { name: "", value: 0 },
      ) => {
        const entry = document.createElement("div");
        entry.classList.add("tracker-entry");
        entry.style.marginBottom = "0.75rem";
        entry.innerHTML = `
          <div class="form-group" style="margin-bottom: 0.5rem;">
            <label>Name</label>
            <div class="form-fields" style="gap: 0.25rem;">
              <input type="text" name="trackerName" placeholder="e.g. Victory Points" value="${foundry.utils.escapeHTML(tracker.name ?? "")}" />
              <button type="button" data-remove-tracker aria-label="Remove tracker"><i class="fa-solid fa-trash"></i></button>
            </div>
          </div>
          <div class="form-group">
            <label>Value</label>
            <div class="form-fields" style="gap: 0.25rem;">
              <button type="button" data-adjust="-1" aria-label="Decrease value"><i class="fa-solid fa-minus"></i></button>
              <input type="number" name="trackerValue" step="1" value="${parseInteger(tracker.value, 0)}" />
              <button type="button" data-adjust="1" aria-label="Increase value"><i class="fa-solid fa-plus"></i></button>
            </div>
          </div>
        `;
        trackerList.append(entry);
        attachEntryHandlers(entry);
      };

      const attachEntryHandlers = (entryRoot: HTMLElement) => {
        const nameInput = entryRoot.querySelector('input[name="trackerName"]');
        const valueInput = entryRoot.querySelector(
          'input[name="trackerValue"]',
        );
        const removeButton = entryRoot.querySelector(
          "button[data-remove-tracker]",
        );

        if (nameInput instanceof HTMLInputElement) {
          nameInput.addEventListener("change", () => void saveState());
        }
        if (!(valueInput instanceof HTMLInputElement)) return;
        if (removeButton instanceof HTMLButtonElement) {
          removeButton.addEventListener("click", () => {
            entryRoot.remove();
            if (!trackerList.querySelector(".tracker-entry")) {
              addTrackerEntry();
            }
            void saveState();
          });
        }

        for (const button of Array.from(
          entryRoot.querySelectorAll("button[data-adjust]"),
        )) {
          button.addEventListener("click", () => {
            const delta = parseInteger(
              (button as HTMLButtonElement).dataset.adjust,
              0,
            );
            const current = parseInteger(valueInput.value, 0);
            valueInput.value = String(current + delta);
            valueInput.focus();
            valueInput.select();
            void saveState();
          });
        }

        valueInput.addEventListener("change", () => void saveState());
      };

      addButton.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        addTrackerEntry();
        void saveState();
      });

      for (const tracker of initialTrackers) {
        addTrackerEntry(coerceTrackerEntry(tracker));
      }
    },
    buttons: [
      {
        action: "addTracker",
        label: "Add Tracker",
        default: true,
      },
    ],
    rejectClose: false,
    modal: false,
  });
}
