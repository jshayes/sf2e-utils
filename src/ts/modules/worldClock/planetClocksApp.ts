import { moduleId } from "../../constants";
import {
  calculatePlanetClockTime,
  getWorldClockTimestamp,
  type PlanetClockDefinition,
  type PlanetClockTime,
} from "./planetClocks";
import { openPlanetClockEditor } from "./planetClockEditor";
import { getPlanetClocks, savePlanetClocks } from "./planetClockStore";

type PlanetView = PlanetClockDefinition & {
  dayLengthLabel: string;
};

type PlanetClockContext = fa.ApplicationRenderContext & {
  planet: PlanetView;
  clock: PlanetClockTime | null;
  canEdit: boolean;
};

type PlanetClockListContext = fa.ApplicationRenderContext & {
  planets: Array<{
    id: string;
    name: string;
    dayLengthLabel: string;
    hasDayNightCycle: boolean;
    currentTime: string | null;
  }>;
  hasPlanets: boolean;
  canEdit: boolean;
};

const HandlebarsApplication = foundry.applications.api.HandlebarsApplicationMixin(
  foundry.applications.api.ApplicationV2,
);

function getDayLengthLabel(definition: PlanetClockDefinition): string {
  if (!hasDayNightCycle(definition)) return "No day/night cycle";
  return `${definition.dayLength.hours}h ${definition.dayLength.minutes}m`;
}

function hasDayNightCycle(
  definition: PlanetClockDefinition,
): definition is PlanetClockDefinition & {
  dayLength: NonNullable<PlanetClockDefinition["dayLength"]>;
} {
  const dayLength = definition.dayLength;
  return Boolean(dayLength && dayLength.hours * 60 + dayLength.minutes > 0);
}

export class PlanetClockApp extends HandlebarsApplication {
  static override DEFAULT_OPTIONS = {
    classes: [moduleId, "planet-clocks"],
    tag: "section",
    position: { width: 440 },
    window: { resizable: true },
  };

  static override PARTS: Record<
    string,
    foundry.applications.api.HandlebarsTemplatePart
  > = {
    main: {
      template: `modules/${moduleId}/templates/planet-clock.hbs`,
      root: true,
    },
  };

  readonly planetId: string;

  constructor(planetId: string) {
    const definition = getPlanetClocks().find((clock) => clock.id === planetId);
    if (!definition) throw new Error(`No planet exists with ID ${planetId}.`);

    super({
      id: `${moduleId}-planet-clock-${planetId}`,
      window: {
        title: hasDayNightCycle(definition)
          ? `${definition.name} Clock`
          : definition.name,
      },
    });
    this.planetId = planetId;
  }

  override async _prepareContext(
    options: fa.ApplicationRenderOptions,
  ): Promise<PlanetClockContext> {
    const context = (await super._prepareContext(
      options,
    )) as fa.ApplicationRenderContext;
    const definition = getPlanetClocks().find(
      (clock) => clock.id === this.planetId,
    );
    if (!definition) throw new Error(`No planet exists with ID ${this.planetId}.`);

    return {
      ...context,
      planet: {
        ...definition,
        dayLengthLabel: getDayLengthLabel(definition),
      },
      clock: hasDayNightCycle(definition)
        ? calculatePlanetClockTime(definition, getWorldClockTimestamp())
        : null,
      canEdit: game.user.isGM,
    };
  }

  protected override async _onRender(
    context: fa.ApplicationRenderContext,
    options: foundry.applications.api.HandlebarsRenderOptions,
  ): Promise<void> {
    await super._onRender(context, options);

    this.element
      .querySelector<HTMLButtonElement>("[data-edit-planet-clock]")
      ?.addEventListener("click", () => {
        const definition = getPlanetClocks().find(
          (clock) => clock.id === this.planetId,
        );
        if (definition) void openPlanetClockEditor(definition);
      });
  }
}

export class PlanetClockListApp extends HandlebarsApplication {
  static override DEFAULT_OPTIONS = {
    id: `${moduleId}-planet-clock-list`,
    classes: [moduleId, "planet-clock-list"],
    tag: "section",
    position: { width: 320 },
    window: { title: "Planet Clocks", resizable: true },
  };

  static override PARTS: Record<
    string,
    foundry.applications.api.HandlebarsTemplatePart
  > = {
    main: {
      template: `modules/${moduleId}/templates/planet-clock-list.hbs`,
      root: true,
    },
  };

  override async _prepareContext(
    options: fa.ApplicationRenderOptions,
  ): Promise<PlanetClockListContext> {
    const context = (await super._prepareContext(
      options,
    )) as fa.ApplicationRenderContext;
    const timestamp = getWorldClockTimestamp();
    const planets = getPlanetClocks().map((definition) => {
      const hasCycle = hasDayNightCycle(definition);
      return {
        id: definition.id,
        name: definition.name,
        dayLengthLabel: getDayLengthLabel(definition),
        hasDayNightCycle: hasCycle,
        currentTime: hasCycle
          ? calculatePlanetClockTime(definition, timestamp).localTime
          : null,
      };
    });

    return {
      ...context,
      planets,
      hasPlanets: planets.length > 0,
      canEdit: game.user.isGM,
    };
  }

  protected override async _onRender(
    context: fa.ApplicationRenderContext,
    options: foundry.applications.api.HandlebarsRenderOptions,
  ): Promise<void> {
    await super._onRender(context, options);

    this.element
      .querySelector<HTMLButtonElement>("[data-add-planet-clock]")
      ?.addEventListener("click", () => void openPlanetClockEditor());

    for (const button of Array.from(
      this.element.querySelectorAll<HTMLButtonElement>("[data-open-planet-clock]"),
    )) {
      button.addEventListener("click", () => {
        const id = button.dataset.openPlanetClock;
        if (id) void openPlanetClock(id);
      });
    }

    for (const button of Array.from(
      this.element.querySelectorAll<HTMLButtonElement>("[data-delete-planet-clock]"),
    )) {
      button.addEventListener("click", () => {
        const id = button.dataset.deletePlanetClock;
        if (id) void deletePlanetClock(id);
      });
    }
  }
}

const planetClockApps = new Map<string, PlanetClockApp>();
let planetClockListApp: PlanetClockListApp | undefined;

export async function openPlanetClockList(): Promise<void> {
  planetClockListApp ??= new PlanetClockListApp();
  await planetClockListApp.render({ force: true });
}

export async function openPlanetClock(planetId: string | number): Promise<void> {
  const clocks = getPlanetClocks();
  const definition =
    typeof planetId === "number"
      ? clocks[planetId]
      : clocks.find((clock) => clock.id === planetId || clock.name === planetId);
  if (!definition) return;

  const app =
    planetClockApps.get(definition.id) ?? new PlanetClockApp(definition.id);
  planetClockApps.set(definition.id, app);
  await app.render({ force: true });
}

export function renderPlanetClocks(): void {
  if (planetClockListApp?.rendered) void planetClockListApp.render();

  const clocks = getPlanetClocks();
  for (const [id, app] of planetClockApps) {
    const definition = clocks.find((clock) => clock.id === id);
    if (!definition) {
      if (app.rendered) void app.close();
      planetClockApps.delete(id);
      continue;
    }

    if (app.rendered) {
      const title = hasDayNightCycle(definition)
        ? `${definition.name} Clock`
        : definition.name;
      app.options.window.title = title;
      app.window.title.textContent = title;
      void app.render();
    }
  }
}

async function deletePlanetClock(planetId: string): Promise<void> {
  if (!game.user.isGM) return;

  const clocks = getPlanetClocks();
  const definition = clocks.find((clock) => clock.id === planetId);
  if (!definition) return;

  const confirmed = await foundry.applications.api.DialogV2.confirm({
    window: { title: `Delete ${definition.name}` },
    content: `<p>Delete ${foundry.utils.escapeHTML(definition.name)} from the planet clock list?</p>`,
    yes: { label: "Delete", icon: "fa-solid fa-trash" },
    no: { label: "Cancel" },
  });
  if (!confirmed) return;

  await savePlanetClocks(clocks.filter((clock) => clock.id !== planetId));
}
