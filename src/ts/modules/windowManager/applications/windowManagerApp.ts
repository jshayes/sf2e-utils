import { moduleId } from "../../../constants";
import {
  windowRegistry,
  type WindowRegistryEntry,
} from "../state/windowRegistry";

type WindowManagerContext = fa.ApplicationRenderContext & {
  search: string;
  hasWindows: boolean;
  windows: Array<{
    key: number;
    name: string;
    type: string;
  }>;
};

const WindowManagerAppBase =
  foundry.applications.api.HandlebarsApplicationMixin(
    foundry.applications.api.ApplicationV2,
  );

export class WindowManagerApp extends WindowManagerAppBase {
  static override DEFAULT_OPTIONS = {
    id: `${moduleId}-window-manager`,
    classes: [moduleId, "window-manager"],
    tag: "section",
    position: { width: 340 },
    window: { title: "Window Manager", resizable: true },
  };

  static override PARTS: Record<
    string,
    foundry.applications.api.HandlebarsTemplatePart
  > = {
    main: {
      template: `modules/${moduleId}/templates/window-manager.hbs`,
      root: true,
    },
  };

  #search = "";
  #entries: WindowRegistryEntry[] = [];
  #unsubscribe: (() => void) | null = null;
  #didFocusSearch = false;

  constructor() {
    super({});
    this.#entries = windowRegistry.list();
    this.#unsubscribe = windowRegistry.subscribe(() => {
      this.#entries = windowRegistry.list();
      void this.render();
    });
  }

  override async close(
    options: fa.ApplicationClosingOptions = {},
  ): Promise<this> {
    this.#unsubscribe?.();
    this.#unsubscribe = null;
    return super.close(options);
  }

  override async _prepareContext(
    options: fa.ApplicationRenderOptions,
  ): Promise<WindowManagerContext> {
    const context = (await super._prepareContext(
      options,
    )) as fa.ApplicationRenderContext;

    const filtered = this.#entries.filter((entry) =>
      `${entry.name} ${entry.type}`
        .toLocaleLowerCase()
        .includes(this.#search.toLocaleLowerCase()),
    );

    return {
      ...context,
      search: this.#search,
      hasWindows: filtered.length > 0,
      windows: filtered.map((entry) => ({
        key: entry.key,
        name: entry.name,
        type: entry.type,
      })),
    };
  }

  protected override async _onRender(
    context: fa.ApplicationRenderContext,
    options: foundry.applications.api.HandlebarsRenderOptions,
  ): Promise<void> {
    await super._onRender(context, options);

    const root = this.element;
    if (!(root instanceof HTMLElement)) return;

    const searchInput = root.querySelector<HTMLInputElement>(
      "[data-window-search]",
    );
    if (searchInput instanceof HTMLInputElement) {
      searchInput.addEventListener("input", () => {
        this.#search = searchInput.value;
        void this.render();
      });
      if (!this.#didFocusSearch) {
        searchInput.focus();
        searchInput.select();
        this.#didFocusSearch = true;
      }
    }

    for (const button of Array.from(
      root.querySelectorAll<HTMLButtonElement>("[data-action='focus-window']"),
    )) {
      button.addEventListener("click", () => {
        const key = Number.parseInt(String(button.dataset.key ?? ""), 10);
        if (!Number.isFinite(key)) return;
        this.#focusWindow(key);
      });
    }
  }

  #focusWindow(key: number): void {
    const entry = this.#entries.find((x) => x.key === key);
    if (!entry) return;
    entry.app.bringToFront();
    entry.app.maximize();
  }
}
