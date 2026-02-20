import { moduleId } from "../../../constants";
import { COMBAT_MANAGER_FLAG_KEY } from "../constants";
import { createCombat } from "../macros/createCombat";

type CombatantEntry = {
  id: string;
  round: number;
  enabled: boolean;
};

type CombatEntry = {
  name: string;
  combatants: CombatantEntry[];
  combatId: string | null;
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
  selectedCombatants: Array<{
    id: string;
    name: string;
    image: string;
    round: number;
    enabled: boolean;
  }>;
  canUpdateCombat: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function coerceCombatant(value: unknown): CombatantEntry | null {
  if (!isRecord(value)) return null;
  const id = value.id;
  if (typeof id !== "string" || id.trim().length === 0) return null;
  const roundValue = value.round;
  const round =
    typeof roundValue === "number" && Number.isFinite(roundValue)
      ? Math.max(0, Math.floor(roundValue))
      : 0;
  const enabled =
    typeof value.enabled === "boolean" ? value.enabled : true;
  return { id, round, enabled };
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
  const combatId = typeof value.combatId === "string" ? value.combatId : null;

  return { name, combatants, combatId };
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
  #hoveredCombatantTokenId: string | null = null;
  #hoverPreviewPreviousTokenIds: string[] | null = null;
  #controlTokenHookId: number;
  #sceneSwitchHookId: number;
  #updateSceneHookId: number;
  #sceneId: string | null = null;

  constructor(options: { selectCombatName?: string } = {}) {
    super({});
    this.#combats = this.#readCombatsFromScene();
    const selectCombatName = options.selectCombatName?.trim();
    if (selectCombatName) {
      const index = this.#findCombatIndexByName(selectCombatName);
      this.#selectedCombatIndex = index >= 0 ? index : null;
    }
    this.#sceneId = game.scenes.current?.id ?? null;
    this.#controlTokenHookId = Hooks.on("controlToken", () => {
      this.#updateButtonStates();
    });
    this.#sceneSwitchHookId = Hooks.on("canvasReady", () => {
      void this.#onSceneSwitch();
    });
    this.#updateSceneHookId = Hooks.on("updateScene", (scene) => {
      void this.#onSceneUpdated(scene);
    });
  }

  override async close(
    options: fa.ApplicationClosingOptions = {},
  ): Promise<this> {
    this.#clearCombatantHover();
    Hooks.off("controlToken", this.#controlTokenHookId);
    Hooks.off("canvasReady", this.#sceneSwitchHookId);
    Hooks.off("updateScene", this.#updateSceneHookId);
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
    const selectCombatantsButton = root.querySelector<HTMLButtonElement>(
      "button[data-action='select-combatants']",
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
    if (selectCombatantsButton instanceof HTMLButtonElement) {
      selectCombatantsButton.addEventListener("click", () =>
        void this.#onSelectCombatants(),
      );
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

    for (const roundInput of Array.from(
      root.querySelectorAll<HTMLInputElement>(
        "[data-action='set-combatant-round']",
      ),
    )) {
      roundInput.addEventListener("change", () => {
        const tokenId = String(roundInput.dataset.id ?? "").trim();
        if (!tokenId) return;
        const parsed = Number.parseInt(roundInput.value, 10);
        const round = Number.isFinite(parsed) ? parsed : 0;
        void this.#onSetCombatantRound(tokenId, round);
      });
    }

    for (const enabledInput of Array.from(
      root.querySelectorAll<HTMLInputElement>(
        "[data-action='set-combatant-enabled']",
      ),
    )) {
      enabledInput.addEventListener("change", () => {
        const tokenId = String(enabledInput.dataset.id ?? "").trim();
        if (!tokenId) return;
        void this.#onSetCombatantEnabled(tokenId, enabledInput.checked);
      });
    }

    for (const combatantRow of Array.from(
      root.querySelectorAll<HTMLElement>("[data-combatant-id]"),
    )) {
      combatantRow.addEventListener("mouseenter", () => {
        const tokenId = String(combatantRow.dataset.combatantId ?? "").trim();
        if (!tokenId) return;
        this.#setCombatantHover(tokenId, true);
      });
      combatantRow.addEventListener("mouseleave", () => {
        const tokenId = String(combatantRow.dataset.combatantId ?? "").trim();
        if (!tokenId) return;
        if (this.#hoveredCombatantTokenId === tokenId) {
          this.#setCombatantHover(tokenId, false);
        }
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

    for (const createButton of Array.from(
      root.querySelectorAll<HTMLButtonElement>(
        "button[data-action='create-combat']",
      ),
    )) {
      createButton.addEventListener("click", (event) => {
        event.stopPropagation();
        const index = parseInteger(createButton.dataset.index, -1);
        if (index < 0) return;
        void this.#onCreateCombat(index);
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
      combatants: controlledTokenIds.map((id) => ({
        id,
        round: 0,
        enabled: true,
      })),
      combatId: null,
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

  async #onCreateCombat(index: number): Promise<void> {
    const combat = this.#combats[index];
    if (!combat) return;
    await createCombat({ name: combat.name });
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
      await this.render();
      return;
    }

    this.#selectedCombatIndex = index;
    await this.render();
  }

  async #onSelectCombatants(): Promise<void> {
    const selectedCombat = this.#getSelectedCombat();
    if (!selectedCombat) return;
    this.#controlTokensForCombat(selectedCombat);
  }

  async #onUpdateCombat(): Promise<void> {
    const selectedCombat = this.#getSelectedCombat();
    if (!selectedCombat) return;

    const controlledTokenIds = getControlledTokenIds();
    if (controlledTokenIds.length === 0) return;

    const previousRounds = new Map(
      selectedCombat.combatants.map((combatant) => [
        combatant.id,
        { round: combatant.round, enabled: combatant.enabled },
      ]),
    );
    selectedCombat.combatants = controlledTokenIds.map((id) => ({
      id,
      round: previousRounds.get(id)?.round ?? 0,
      enabled: previousRounds.get(id)?.enabled ?? true,
    }));
    await this.#saveCombatsToScene();
    await this.render();
  }

  async #onSetCombatantRound(tokenId: string, round: number): Promise<void> {
    const selectedCombat = this.#getSelectedCombat();
    if (!selectedCombat) return;

    const combatant = selectedCombat.combatants.find((x) => x.id === tokenId);
    if (!combatant) return;

    combatant.round = Math.max(0, Math.floor(round));
    await this.#saveCombatsToScene();
  }

  async #onSetCombatantEnabled(
    tokenId: string,
    enabled: boolean,
  ): Promise<void> {
    const selectedCombat = this.#getSelectedCombat();
    if (!selectedCombat) return;

    const combatant = selectedCombat.combatants.find((x) => x.id === tokenId);
    if (!combatant) return;

    combatant.enabled = enabled;
    await this.#saveCombatsToScene();
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
    await this.#renderIfConnected();
  }

  async #onSceneUpdated(scene: foundry.documents.Scene): Promise<void> {
    if (scene.id !== this.#sceneId) return;

    this.#combats = this.#readCombatsFromScene();
    if (
      this.#selectedCombatIndex !== null &&
      this.#selectedCombatIndex >= this.#combats.length
    ) {
      this.#selectedCombatIndex = null;
    }
    await this.#renderIfConnected();
  }

  async #renderIfConnected(): Promise<void> {
    const root = this.element;
    if (!(root instanceof HTMLElement)) return;
    if (!root.isConnected) return;
    if (!(root.parentElement instanceof HTMLElement)) return;
    await this.render();
  }

  #hasCombatWithName(name: string, ignoreIndex: number | null = null): boolean {
    const normalized = name.trim().toLocaleLowerCase();
    return this.#combats.some((combat, index) => {
      if (ignoreIndex !== null && index === ignoreIndex) return false;
      return combat.name.trim().toLocaleLowerCase() === normalized;
    });
  }

  #findCombatIndexByName(name: string): number {
    const normalized = name.trim().toLocaleLowerCase();
    return this.#combats.findIndex(
      (combat) => combat.name.trim().toLocaleLowerCase() === normalized,
    );
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

  #getCurrentlyControlledTokenIds(): string[] {
    return (canvas?.tokens?.controlled ?? [])
      .map((token) => token.id)
      .filter((id): id is string => typeof id === "string" && id.length > 0);
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

  #setCombatantHover(tokenId: string, hover: boolean): void {
    const token = this.#getPlaceableTokenById(tokenId);
    if (!token) return;

    if (hover) {
      if (
        this.#hoveredCombatantTokenId &&
        this.#hoveredCombatantTokenId !== tokenId
      ) {
        this.#clearCombatantHover();
      }
      if (this.#hoverPreviewPreviousTokenIds === null) {
        this.#hoverPreviewPreviousTokenIds = this.#getCurrentlyControlledTokenIds();
      }
      token.control({ releaseOthers: true });
      this.#hoveredCombatantTokenId = tokenId;
      return;
    }

    token.release();
    this.#restoreHoverPreviewSelection();
    if (this.#hoveredCombatantTokenId === tokenId) {
      this.#hoveredCombatantTokenId = null;
    }
  }

  #restoreHoverPreviewSelection(): void {
    if (!this.#hoverPreviewPreviousTokenIds) return;
    canvas?.tokens?.releaseAll();
    for (const tokenId of this.#hoverPreviewPreviousTokenIds) {
      const previousToken = this.#getPlaceableTokenById(tokenId);
      previousToken?.control({ releaseOthers: false });
    }
    this.#hoverPreviewPreviousTokenIds = null;
  }

  #clearCombatantHover(): void {
    if (!this.#hoveredCombatantTokenId) return;
    const token = this.#getPlaceableTokenById(this.#hoveredCombatantTokenId);
    if (token) {
      token.release();
    }
    this.#restoreHoverPreviewSelection();
    this.#hoveredCombatantTokenId = null;
  }

  #buildCombatantRows(
    combat: CombatEntry,
  ): Array<{
    id: string;
    name: string;
    image: string;
    round: number;
    enabled: boolean;
  }> {
    return combat.combatants.map((combatant) => {
      const token = this.#getPlaceableTokenById(combatant.id);
      const tokenDocument = token?.document;
      const actorImage = tokenDocument?.actor?.img;
      const tokenImage = tokenDocument?.texture?.src;
      return {
        id: combatant.id,
        name: tokenDocument?.name ?? `Missing Token (${combatant.id})`,
        image: actorImage || tokenImage || "icons/svg/mystery-man.svg",
        round: combatant.round,
        enabled: combatant.enabled,
      };
    });
  }
}
