import { mount, unmount } from "svelte";
import { moduleId } from "../../../constants";
import RadialMenuEditorApp from "../ui/RadialMenuEditorApp.svelte";

const RadialMenuEditorAppBase =
  foundry.applications.api.HandlebarsApplicationMixin(
    foundry.applications.api.ApplicationV2,
  );

export class RadialMenuEditorApplication extends RadialMenuEditorAppBase {
  static override DEFAULT_OPTIONS = {
    id: `${moduleId}-radial-menu-editor`,
    classes: [moduleId, "radial-menu-editor-window"],
    tag: "section",
    position: { width: 720, height: 520 },
    window: { title: "Macro Radial Menu Editor", resizable: false },
  };

  static override PARTS: Record<
    string,
    foundry.applications.api.HandlebarsTemplatePart
  > = {
    main: {
      template: `modules/${moduleId}/templates/radial-menu-editor.hbs`,
      root: true,
      scrollable: [""],
    },
  };

  #component: ReturnType<typeof mount> | null = null;
  #mountedRoot: HTMLElement | null = null;

  protected override async _prepareContext(): Promise<Record<string, unknown>> {
    return {};
  }

  protected override _attachPartListeners(
    _partId: string,
    htmlElement: HTMLElement,
  ): void {
    const root = this.element ?? htmlElement;
    const target = root.querySelector<HTMLElement>(
      "[data-radial-menu-editor-root]",
    );
    if (!(target instanceof HTMLElement)) return;
    if (this.#mountedRoot === target && this.#component) return;

    if (this.#component) {
      void unmount(this.#component);
      this.#component = null;
    }

    this.#mountedRoot = target;
    this.#component = mount(RadialMenuEditorApp, {
      target,
      props: {
        onClose: () => {
          void this.close();
        },
      },
    });
  }

  override async close(options?: unknown): Promise<this> {
    if (this.#component) {
      void unmount(this.#component);
      this.#component = null;
    }
    this.#mountedRoot = null;
    return await super.close(options as never);
  }
}

let app: RadialMenuEditorApplication | null = null;

export async function openRadialMenuEditorApp(): Promise<void> {
  if (!app) {
    app = new RadialMenuEditorApplication();
  }

  await app.render({ force: true });
}

export async function closeRadialMenuEditorApp(): Promise<void> {
  if (!app) return;
  const closingApp = app;
  app = null;
  await closingApp.close();
}
