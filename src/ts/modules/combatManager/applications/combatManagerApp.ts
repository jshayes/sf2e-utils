import { moduleId } from "../../../constants";
import { COMBAT_MANAGER_FLAG_KEY } from "../constants";

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
  combats: Array<{
    index: number;
    name: string;
    combatantCount: number;
    isSelected: boolean;
  }>;
  hasCombats: boolean;
  hasSelectedCombat: boolean;
  selectedCombatName: string;
  selectedCombatants: Array<{ id: string; name: string; image: string }>;
  canUpdateCombat: boolean;
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

  const combatantsInput = Array.isArray(value.combatants)
    ? value.combatants
    : [];
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

function parseInteger(value: unknown, fallback = 0): number {
  const text = String(value ?? "").trim();
  if (!/^[+-]?\d+$/.test(text)) return fallback;
  return Number.parseInt(text, 10);
}

const CombatManagerAppBase =
  foundry.applications.api.HandlebarsApplicationMixin(
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
  #selectedCombatIndex: number | null = null;
  #controlTokenHookId: number;
  #sceneSwitchHookId: number;
  #sceneId: string | null = null;

  constructor() {
    super({});
    this.#combats = this.#readCombatsFromScene();
    this.#sceneId = game.scenes.current?.id ?? null;
    this.#controlTokenHookId = Hooks.on("controlToken", () => {
      this.#updateButtonStates();
    });
    this.#sceneSwitchHookId = Hooks.on("canvasReady", () => {
      void this.#onSceneSwitch();
    });
  }

  override async close(
    options: fa.ApplicationClosingOptions = {},
  ): Promise<this> {
    Hooks.off("controlToken", this.#controlTokenHookId);
    Hooks.off("canvasReady", this.#sceneSwitchHookId);
    return super.close(options);
  }

  override async _prepareContext(
    options: fa.ApplicationRenderOptions,
  ): Promise<CombatManagerContext> {
    const context = (await super._prepareContext(
      options,
    )) as fa.ApplicationRenderContext;
    const selectedCombat = this.#getSelectedCombat();

    return {
      ...context,
      combatName: this.#combatName,
      canAddCombat: this.#canAddCombat(),
      combats: this.#combats.map((combat, index) => ({
        index,
        name: combat.name,
        combatantCount: combat.combatants.length,
        isSelected: this.#selectedCombatIndex === index,
      })),
      hasCombats: this.#combats.length > 0,
      hasSelectedCombat: selectedCombat !== null,
      selectedCombatName: selectedCombat?.name ?? "",
      selectedCombatants:
        selectedCombat === null ? [] : this.#buildCombatantRows(selectedCombat),
      canUpdateCombat:
        selectedCombat !== null && getControlledTokenIds().length > 0,
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
    const updateButton = root.querySelector<HTMLButtonElement>(
      "button[data-action='update-combat']",
    );
    const selectedNameInput = root.querySelector<HTMLInputElement>(
      "input[data-action='rename-selected-combat']",
    );

    if (nameInput instanceof HTMLInputElement) {
      nameInput.addEventListener("input", () => {
        this.#combatName = nameInput.value;
        this.#updateButtonStates();
      });
    }

    if (addButton instanceof HTMLButtonElement) {
      addButton.addEventListener("click", () => void this.#onAddCombat());
    }

    if (updateButton instanceof HTMLButtonElement) {
      updateButton.addEventListener("click", () => void this.#onUpdateCombat());
    }

    if (selectedNameInput instanceof HTMLInputElement) {
      selectedNameInput.addEventListener("keydown", (event) => {
        if (event.key !== "Enter") return;
        event.preventDefault();
        selectedNameInput.blur();
      });
      selectedNameInput.addEventListener("change", () => {
        void this.#onRenameSelectedCombat(selectedNameInput.value);
      });
    }

    for (const row of Array.from(
      root.querySelectorAll<HTMLElement>("[data-action='select-combat']"),
    )) {
      row.addEventListener("click", () => {
        const index = parseInteger(row.dataset.index, -1);
        if (index < 0) return;
        void this.#onToggleCombatSelection(index);
      });
    }

    for (const deleteButton of Array.from(
      root.querySelectorAll<HTMLButtonElement>(
        "button[data-action='delete-combat']",
      ),
    )) {
      deleteButton.addEventListener("click", (event) => {
        event.stopPropagation();
        const index = parseInteger(deleteButton.dataset.index, -1);
        if (index < 0) return;
        void this.#onDeleteCombat(index);
      });
    }

    this.#updateButtonStates();
  }

  #canAddCombat(): boolean {
    const name = this.#combatName.trim();
    return (
      name.length > 0 &&
      !this.#hasCombatWithName(name) &&
      getControlledTokenIds().length > 0
    );
  }

  #updateButtonStates(): void {
    const root = this.element;
    if (!(root instanceof HTMLElement)) return;

    const addButton = root.querySelector<HTMLButtonElement>(
      "button[data-action='add-combat']",
    );
    if (addButton instanceof HTMLButtonElement) {
      addButton.disabled = !this.#canAddCombat();
    }

    const updateButton = root.querySelector<HTMLButtonElement>(
      "button[data-action='update-combat']",
    );
    if (updateButton instanceof HTMLButtonElement) {
      updateButton.disabled = !this.#canUpdateCombat();
    }
  }

  #readCombatsFromScene(): CombatEntry[] {
    const scene = game.scenes.current;
    if (!scene) return [];

    const raw = scene.getFlag(moduleId, COMBAT_MANAGER_FLAG_KEY);
    if (!Array.isArray(raw)) return [];

    return raw
      .map(coerceCombat)
      .filter((combat): combat is CombatEntry => combat !== null);
  }

  async #saveCombatsToScene(): Promise<void> {
    const scene = game.scenes.current;
    if (!scene) return;
    await scene.setFlag(moduleId, COMBAT_MANAGER_FLAG_KEY, this.#combats);
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
    if (this.#hasCombatWithName(name)) {
      ui.notifications.warn(`A combat named "${name}" already exists.`);
      return;
    }

    this.#combats.push({
      name,
      combatants: controlledTokenIds.map((id) => ({ id })),
    });

    this.#combatName = "";
    await this.#saveCombatsToScene();
    await this.render();
  }

  async #onDeleteCombat(index: number): Promise<void> {
    if (index < 0 || index >= this.#combats.length) return;
    this.#combats.splice(index, 1);
    if (this.#selectedCombatIndex === index) {
      this.#selectedCombatIndex = null;
      this.#releaseAllTokens();
    } else if (
      this.#selectedCombatIndex !== null &&
      this.#selectedCombatIndex > index
    ) {
      this.#selectedCombatIndex -= 1;
    }
    await this.#saveCombatsToScene();
    await this.render();
  }

  async #onRenameSelectedCombat(nextName: string): Promise<void> {
    if (this.#selectedCombatIndex === null) return;
    const index = this.#selectedCombatIndex;
    const combat = this.#combats[index];
    if (!combat) return;

    const name = nextName.trim();
    if (!name) {
      ui.notifications.warn("Combat name cannot be empty.");
      await this.render();
      return;
    }

    if (this.#hasCombatWithName(name, index)) {
      ui.notifications.warn(`A combat named "${name}" already exists.`);
      await this.render();
      return;
    }

    if (combat.name === name) return;
    combat.name = name;
    await this.#saveCombatsToScene();
    await this.render();
  }

  async #onToggleCombatSelection(index: number): Promise<void> {
    if (index < 0 || index >= this.#combats.length) return;

    if (this.#selectedCombatIndex === index) {
      this.#selectedCombatIndex = null;
      this.#releaseAllTokens();
      await this.render();
      return;
    }

    this.#selectedCombatIndex = index;
    const combat = this.#combats[index];
    if (combat) {
      this.#controlTokensForCombat(combat);
    }
    await this.render();
  }

  async #onUpdateCombat(): Promise<void> {
    const selectedCombat = this.#getSelectedCombat();
    if (!selectedCombat) return;

    const controlledTokenIds = getControlledTokenIds();
    if (controlledTokenIds.length === 0) return;

    selectedCombat.combatants = controlledTokenIds.map((id) => ({ id }));
    await this.#saveCombatsToScene();
    await this.render();
  }

  async #onSceneSwitch(): Promise<void> {
    const currentSceneId = game.scenes.current?.id ?? null;
    if (currentSceneId === this.#sceneId) {
      this.#updateButtonStates();
      return;
    }

    this.#sceneId = currentSceneId;
    this.#combatName = "";
    this.#selectedCombatIndex = null;
    this.#combats = this.#readCombatsFromScene();
    await this.render();
  }

  #hasCombatWithName(name: string, ignoreIndex: number | null = null): boolean {
    const normalized = name.trim().toLocaleLowerCase();
    return this.#combats.some((combat, index) => {
      if (ignoreIndex !== null && index === ignoreIndex) return false;
      return combat.name.trim().toLocaleLowerCase() === normalized;
    });
  }

  #getSelectedCombat(): CombatEntry | null {
    if (
      this.#selectedCombatIndex === null ||
      this.#selectedCombatIndex < 0 ||
      this.#selectedCombatIndex >= this.#combats.length
    ) {
      return null;
    }
    return this.#combats[this.#selectedCombatIndex] ?? null;
  }

  #canUpdateCombat(): boolean {
    return (
      this.#getSelectedCombat() !== null && getControlledTokenIds().length > 0
    );
  }

  #getPlaceableTokenById(id: string) {
    const tokens = canvas?.tokens?.placeables ?? [];
    for (const token of tokens) {
      if (token.id === id) return token;
    }
    return null;
  }

  #releaseAllTokens(): void {
    canvas?.tokens?.releaseAll();
  }

  #controlTokensForCombat(combat: CombatEntry): void {
    this.#releaseAllTokens();
    for (const combatant of combat.combatants) {
      const token = this.#getPlaceableTokenById(combatant.id);
      token?.control({ releaseOthers: false });
    }
  }

  #buildCombatantRows(
    combat: CombatEntry,
  ): Array<{ id: string; name: string; image: string }> {
    return combat.combatants.map((combatant) => {
      const token = this.#getPlaceableTokenById(combatant.id);
      const tokenDocument = token?.document;
      const actorImage = tokenDocument?.actor?.img;
      const tokenImage = tokenDocument?.texture?.src;
      return {
        id: combatant.id,
        name: tokenDocument?.name ?? `Missing Token (${combatant.id})`,
        image: actorImage || tokenImage || "icons/svg/mystery-man.svg",
      };
    });
  }
}
