import { moduleId } from "../../../constants";

const FLAG_KEY = "combat-manager.combats";

type CombatantEntry = {
  id: string;
};

type CombatEntry = {
  name: string;
  combatants: CombatantEntry[];
};

type CombatManagerContext = fa.ApplicationRenderContext & {
  combatName: string;
  canAddCombat: boolean;
  combats: Array<{ name: string; combatantCount: number }>;
  hasCombats: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function coerceCombatant(value: unknown): CombatantEntry | null {
  if (!isRecord(value)) return null;
  const id = value.id;
  if (typeof id !== "string" || id.trim().length === 0) return null;
  return { id };
}

function coerceCombat(value: unknown): CombatEntry | null {
  if (!isRecord(value)) return null;

  const name = value.name;
  if (typeof name !== "string") return null;

  const combatantsInput = Array.isArray(value.combatants) ? value.combatants : [];
  const combatants = combatantsInput
    .map(coerceCombatant)
    .filter((entry): entry is CombatantEntry => entry !== null);

  return { name, combatants };
}

function getControlledTokenIds(): string[] {
  return (canvas?.tokens?.controlled ?? [])
    .map((token) => token.id)
    .filter((id): id is string => typeof id === "string" && id.length > 0);
}

const CombatManagerAppBase = foundry.applications.api.HandlebarsApplicationMixin(
  foundry.applications.api.ApplicationV2,
);

export class CombatManagerApp extends CombatManagerAppBase {
  static override DEFAULT_OPTIONS = {
    id: `${moduleId}-combat-manager`,
    classes: [moduleId, "combat-manager"],
    tag: "section",
    position: { width: 420 },
    window: { title: "Combat Manager", resizable: false },
  };

  static override PARTS: Record<
    string,
    foundry.applications.api.HandlebarsTemplatePart
  > = {
    main: {
      template: `modules/${moduleId}/templates/combat-manager.hbs`,
      root: true,
    },
  };

  #combatName = "";
  #combats: CombatEntry[];
  #controlTokenHookId: number;
  #canvasReadyHookId: number;

  constructor() {
    super({});
    this.#combats = this.#readCombatsFromScene();
    this.#controlTokenHookId = Hooks.on("controlToken", () => {
      this.#updateAddButtonState();
    });
    this.#canvasReadyHookId = Hooks.on("canvasReady", () => {
      this.#updateAddButtonState();
    });
  }

  override async close(
    options: fa.ApplicationClosingOptions = {},
  ): Promise<this> {
    Hooks.off("controlToken", this.#controlTokenHookId);
    Hooks.off("canvasReady", this.#canvasReadyHookId);
    return super.close(options);
  }

  override async _prepareContext(
    options: fa.ApplicationRenderOptions,
  ): Promise<CombatManagerContext> {
    const context = (await super._prepareContext(
      options,
    )) as fa.ApplicationRenderContext;

    return {
      ...context,
      combatName: this.#combatName,
      canAddCombat: this.#canAddCombat(),
      combats: this.#combats.map((combat) => ({
        name: combat.name,
        combatantCount: combat.combatants.length,
      })),
      hasCombats: this.#combats.length > 0,
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
      "input[data-combat-name]",
    );
    const addButton = root.querySelector<HTMLButtonElement>(
      "button[data-action='add-combat']",
    );

    if (nameInput instanceof HTMLInputElement) {
      nameInput.addEventListener("input", () => {
        this.#combatName = nameInput.value;
        this.#updateAddButtonState();
      });
    }

    if (addButton instanceof HTMLButtonElement) {
      addButton.addEventListener("click", () => void this.#onAddCombat());
    }

    this.#updateAddButtonState();
  }

  #canAddCombat(): boolean {
    return this.#combatName.trim().length > 0 && getControlledTokenIds().length > 0;
  }

  #updateAddButtonState(): void {
    const root = this.element;
    if (!(root instanceof HTMLElement)) return;

    const addButton = root.querySelector<HTMLButtonElement>(
      "button[data-action='add-combat']",
    );
    if (!(addButton instanceof HTMLButtonElement)) return;

    addButton.disabled = !this.#canAddCombat();
  }

  #readCombatsFromScene(): CombatEntry[] {
    const scene = game.scenes.current;
    if (!scene) return [];

    const raw = scene.getFlag(moduleId, FLAG_KEY);
    if (!Array.isArray(raw)) return [];

    return raw
      .map(coerceCombat)
      .filter((combat): combat is CombatEntry => combat !== null);
  }

  async #saveCombatsToScene(): Promise<void> {
    const scene = game.scenes.current;
    if (!scene) return;
    await scene.setFlag(moduleId, FLAG_KEY, this.#combats);
  }

  async #onAddCombat(): Promise<void> {
    const scene = game.scenes.current;
    if (!scene) {
      ui.notifications.warn("No active scene available.");
      return;
    }

    const name = this.#combatName.trim();
    const controlledTokenIds = getControlledTokenIds();
    if (!name || controlledTokenIds.length === 0) return;

    this.#combats.push({
      name,
      combatants: controlledTokenIds.map((id) => ({ id })),
    });

    this.#combatName = "";
    await this.#saveCombatsToScene();
    await this.render();
  }
}
