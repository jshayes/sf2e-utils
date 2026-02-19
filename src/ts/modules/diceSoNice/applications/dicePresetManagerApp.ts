import { moduleId } from "../../../constants";
import { FLAG_KEY } from "../constants";
import { Appearance, DicePreset, DicePresetFlags } from "../types";
import { applyPreset, loadDiceForUser } from "../utils";

type DicePresetMap = Record<string, DicePreset>;

type DicePresetRow = {
  name: string;
  enabled: boolean;
};

type DicePresetManagerContext = fa.ApplicationRenderContext & {
  newPresetName: string;
  canAddPreset: boolean;
  presets: DicePresetRow[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function coercePreset(value: DicePreset): DicePreset | null {
  return {
    enabled: value.enabled !== false,
    appearance: foundry.utils.deepClone(value.appearance),
  };
}

function validateFlags(value: unknown): value is DicePresetFlags {
  if (isRecord(value)) {
    return true;
  }
  return false;
}

function coercePresetMap(value: DicePresetFlags): DicePresetMap {
  if (!isRecord(value)) return {};

  const map: DicePresetMap = {};
  for (const [name, presetValue] of Object.entries(value)) {
    const preset = coercePreset(presetValue);
    if (!preset) continue;
    map[name] = preset;
  }
  return map;
}

function getCurrentAppearance(): Appearance | null {
  const appearanceFlag = game.user.getFlag("dice-so-nice", "appearance");
  if (!isRecord(appearanceFlag)) return null;
  return foundry.utils.deepClone(appearanceFlag) as Appearance;
}

const DicePresetManagerAppBase =
  foundry.applications.api.HandlebarsApplicationMixin(
    foundry.applications.api.ApplicationV2,
  );

export class DicePresetManagerApp extends DicePresetManagerAppBase {
  static override DEFAULT_OPTIONS = {
    id: `${moduleId}-dice-preset-manager`,
    classes: [moduleId, "dice-preset-manager"],
    tag: "section",
    position: { width: 420 },
    window: { title: "Dice Presets", resizable: false },
  };
  static override PARTS: Record<
    string,
    foundry.applications.api.HandlebarsTemplatePart
  > = {
    main: {
      template: `modules/${moduleId}/templates/dice-preset-manager.hbs`,
      root: true,
    },
  };

  #newPresetName = "";
  #presets: DicePresetMap = {};

  constructor() {
    super({});

    const flags = game.user.getFlag(moduleId, FLAG_KEY);
    if (!validateFlags(flags)) {
      this.#presets = coercePresetMap({});
    } else {
      this.#presets = coercePresetMap(flags);
    }
  }

  override async _prepareContext(
    options: fa.ApplicationRenderOptions,
  ): Promise<DicePresetManagerContext> {
    const context = (await super._prepareContext(
      options,
    )) as fa.ApplicationRenderContext;

    return {
      ...context,
      newPresetName: this.#newPresetName,
      canAddPreset: this.#newPresetName.trim().length > 0,
      presets: Object.entries(this.#presets)
        .map(([name, preset]) => ({
          name,
          enabled: preset.enabled,
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    };
  }

  protected override async _onRender(
    context: fa.ApplicationRenderContext,
    options: foundry.applications.api.HandlebarsRenderOptions,
  ): Promise<void> {
    await super._onRender(context, options);

    const root = this.element;
    if (!(root instanceof HTMLElement)) return;

    const nameInput = root.querySelector<HTMLInputElement>(
      "input[data-preset-name]",
    );
    const addButton = root.querySelector<HTMLButtonElement>(
      "button[data-action='add-preset']",
    );

    if (nameInput instanceof HTMLInputElement) {
      nameInput.addEventListener("input", () => {
        this.#newPresetName = nameInput.value;
        if (addButton instanceof HTMLButtonElement) {
          addButton.disabled = this.#newPresetName.trim().length === 0;
        }
      });
    }

    if (addButton instanceof HTMLButtonElement) {
      addButton.addEventListener("click", () => void this.#onAddPreset());
    }

    for (const toggle of Array.from(
      root.querySelectorAll<HTMLInputElement>(
        "input[data-action='toggle-preset']",
      ),
    )) {
      toggle.addEventListener("change", () => {
        const name = String(toggle.dataset.name ?? "").trim();
        if (!name) return;
        void this.#setPresetEnabled(name, toggle.checked);
      });
    }

    for (const applyButton of Array.from(
      root.querySelectorAll<HTMLButtonElement>(
        "button[data-action='apply-preset']",
      ),
    )) {
      applyButton.addEventListener("click", () => {
        const name = String(applyButton.dataset.name ?? "").trim();
        if (!name) return;
        void this.#applyPreset(name);
      });
    }

    for (const deleteButton of Array.from(
      root.querySelectorAll<HTMLButtonElement>(
        "button[data-action='delete-preset']",
      ),
    )) {
      deleteButton.addEventListener("click", () => {
        const name = String(deleteButton.dataset.name ?? "").trim();
        if (!name) return;
        void this.#deletePreset(name);
      });
    }
  }

  async #onAddPreset(): Promise<void> {
    const name = this.#newPresetName.trim();
    if (!name) return;

    if (this.#presets[name]) {
      ui.notifications.warn(`Preset "${name}" already exists.`);
      return;
    }

    const appearance = getCurrentAppearance();
    if (appearance === null || appearance === undefined) {
      ui.notifications.error(
        "Could not read Dice So Nice appearance from user flags.",
      );
      return;
    }

    this.#presets[name] = {
      enabled: true,
      appearance,
    };
    this.#newPresetName = "";
    await this.#savePresets();
    await this.render();
  }

  async #setPresetEnabled(name: string, enabled: boolean): Promise<void> {
    const preset = this.#presets[name];
    if (!preset) return;
    preset.enabled = enabled;
    await this.#savePresets();
  }

  async #deletePreset(name: string): Promise<void> {
    if (!this.#presets[name]) return;

    delete this.#presets[name];
    await game.user.unsetFlag(moduleId, `${FLAG_KEY}.${name}`);

    await this.render();
  }

  #reloadDSNWindow() {
    const existingDiceConfig = document.querySelector(
      "#dice-config.dice-so-nice",
    );

    if (existingDiceConfig) {
      const menu = game.settings.menus.get("dice-so-nice.dice-so-nice");
      if (!menu) {
        ui.notifications.warn("Dice So Nice settings menu is unavailable.");
        return;
      }
      const { left, top } = existingDiceConfig.getBoundingClientRect();
      const dsnApp = new menu.type({ position: { left, top } });
      dsnApp.render(true);
    }
  }

  async #applyPreset(name: string): Promise<void> {
    const preset = this.#presets[name];
    if (!preset) return;

    await applyPreset(preset);
    await loadDiceForUser(game.user);
    this.#reloadDSNWindow();

    ui.notifications.info(`Applied dice preset "${name}".`);
  }

  async #savePresets(): Promise<void> {
    await game.user.setFlag(moduleId, FLAG_KEY, this.#presets);
  }
}
