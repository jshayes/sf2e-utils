import { moduleId } from "../constants";

const FLAG_KEY = "number-tracker-state";

type TrackerEntry = {
  name: string;
  value: number;
};

type TrackerState = {
  trackers: TrackerEntry[];
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

export async function numberTracker(): Promise<void> {
  const savedState = game.user.getFlag(moduleId, FLAG_KEY) as
    | TrackerState
    | undefined;
  const initialTrackers =
    Array.isArray(savedState?.trackers) && savedState.trackers.length
      ? savedState.trackers.map(coerceTrackerEntry)
      : [{ name: "", value: 0 }];

  if (!foundry.applications.api.DialogV2) {
    throw new Error("DialogV2 API is unavailable.");
  }

  await foundry.applications.api.DialogV2.wait({
    window: { title: "Number Tracker" },
    content: `
      <div data-tracker-list></div>
      <div class="form-group">
        <button type="button" data-add-tracker>Add Tracker</button>
      </div>
    `,
    render: (_event: Event, dialog: { element?: HTMLElement | null }) => {
      const root = dialog.element;
      if (!root) return;

      const trackerList = root.querySelector("[data-tracker-list]");
      const addButton = root.querySelector("button[data-add-tracker]");
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
        await game.user.setFlag(moduleId, FLAG_KEY, getStateFromDom());
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
              <button type="button" data-remove-tracker aria-label="Remove tracker">X</button>
            </div>
          </div>
          <div class="form-group">
            <label>Value</label>
            <div class="form-fields" style="gap: 0.25rem;">
              <button type="button" data-adjust="-1" aria-label="Decrease value">-</button>
              <input type="number" name="trackerValue" step="1" value="${parseInteger(tracker.value, 0)}" />
              <button type="button" data-adjust="1" aria-label="Increase value">+</button>
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

      addButton.addEventListener("click", () => {
        addTrackerEntry();
        void saveState();
      });

      for (const tracker of initialTrackers) {
        addTrackerEntry(coerceTrackerEntry(tracker));
      }
    },
    buttons: [
      {
        action: "close",
        label: "Close",
        default: true,
      },
    ],
    rejectClose: false,
    modal: false,
  });
}
