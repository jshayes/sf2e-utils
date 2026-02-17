import { moduleId } from "../constants";

const FLAG_KEY = "number-tracker-state";

type TrackerEntry = {
  name: string;
  value: number;
};

type TrackerState = {
  trackers: TrackerEntry[];
};

type NumberTrackerContext = fa.ApplicationRenderContext & {
  trackers: TrackerEntry[];
  hasTrackers: boolean;
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

function getInitialTrackers(state: TrackerState | undefined): TrackerEntry[] {
  if (!Array.isArray(state?.trackers) || state.trackers.length === 0) {
    return [{ name: "", value: 0 }];
  }
  return state.trackers.map(coerceTrackerEntry);
}

const NumberTrackerAppBase =
  foundry.applications.api.HandlebarsApplicationMixin(
    foundry.applications.api.ApplicationV2,
  );

export class NumberTrackerApp extends NumberTrackerAppBase {
  static override DEFAULT_OPTIONS = {
    classes: [moduleId, "number-tracker"],
    tag: "section",
    position: { width: 300 },
    window: { resizable: false },
  };

  static override PARTS: Record<
    string,
    foundry.applications.api.HandlebarsTemplatePart
  > = {
    main: {
      template: `modules/${moduleId}/templates/number-tracker.hbs`,
      root: true,
    },
  };

  #flagKey: string;
  #trackers: TrackerEntry[];

  constructor(options: { name?: string }) {
    const title = `Number Tracker${options.name ? `: ${options.name}` : ""}`;
    const name = options.name ?? "default";

    super({
      id: `${moduleId}-number-tracker-${name}`,
      window: { title },
    });

    this.#flagKey = `${FLAG_KEY}.${name}`;
    const savedState = game.user.getFlag(moduleId, this.#flagKey) as
      | TrackerState
      | undefined;
    this.#trackers = getInitialTrackers(savedState);
  }

  override async _prepareContext(
    options: fa.ApplicationRenderOptions,
  ): Promise<NumberTrackerContext> {
    const context = (await super._prepareContext(
      options,
    )) as fa.ApplicationRenderContext;
    return {
      ...context,
      trackers: this.#trackers,
      hasTrackers: this.#trackers.length > 0,
    };
  }

  protected override async _onRender(
    context: fa.ApplicationRenderContext,
    options: foundry.applications.api.HandlebarsRenderOptions,
  ): Promise<void> {
    await super._onRender(context, options);

    const root = this.element;
    if (!(root instanceof HTMLElement)) return;

    const addButton = root.querySelector("[data-action='add-tracker']");
    if (addButton instanceof HTMLButtonElement) {
      addButton.addEventListener("click", () => void this.#onAddTracker());
    }

    for (const removeButton of Array.from(
      root.querySelectorAll("button[data-action='remove-tracker']"),
    )) {
      if (!(removeButton instanceof HTMLButtonElement)) continue;
      removeButton.addEventListener("click", () => {
        const index = parseInteger(removeButton.dataset.index, -1);
        if (index < 0) return;
        void this.#onRemoveTracker(index);
      });
    }

    for (const adjustButton of Array.from(
      root.querySelectorAll("button[data-action='adjust-value']"),
    )) {
      if (!(adjustButton instanceof HTMLButtonElement)) continue;
      adjustButton.addEventListener("click", () => {
        const index = parseInteger(adjustButton.dataset.index, -1);
        const delta = parseInteger(adjustButton.dataset.delta, 0);
        if (index < 0 || delta === 0) return;
        void this.#onAdjustValue(index, delta);
      });
    }

    for (const input of Array.from(
      root.querySelectorAll<HTMLInputElement>("[data-tracker-input]"),
    )) {
      input.addEventListener("change", () => void this.#onInputsChanged());
    }
  }

  async #onAddTracker(): Promise<void> {
    this.#syncFromDom();
    this.#trackers.push({ name: "", value: 0 });
    await this.#saveState();
    await this.render();
  }

  async #onRemoveTracker(index: number): Promise<void> {
    this.#syncFromDom();
    this.#trackers.splice(index, 1);
    if (this.#trackers.length === 0) {
      this.#trackers.push({ name: "", value: 0 });
    }
    await this.#saveState();
    await this.render();
  }

  async #onAdjustValue(index: number, delta: number): Promise<void> {
    this.#syncFromDom();
    const tracker = this.#trackers[index];
    if (!tracker) return;
    tracker.value += delta;
    await this.#saveState();
    await this.render();
  }

  async #onInputsChanged(): Promise<void> {
    this.#syncFromDom();
    await this.#saveState();
  }

  #syncFromDom(): void {
    const root = this.element;
    if (!(root instanceof HTMLElement)) return;

    const entries = Array.from(
      root.querySelectorAll<HTMLElement>("[data-tracker-entry]"),
    );

    this.#trackers = entries.map((entry) => {
      const nameInput = entry.querySelector<HTMLInputElement>(
        'input[name="trackerName"]',
      );
      const valueInput = entry.querySelector<HTMLInputElement>(
        'input[name="trackerValue"]',
      );

      return {
        name: nameInput?.value.trim() ?? "",
        value: parseInteger(valueInput?.value, 0),
      };
    });
  }

  async #saveState(): Promise<void> {
    await game.user.setFlag(moduleId, this.#flagKey, {
      trackers: this.#trackers.map(coerceTrackerEntry),
    });
  }
}
