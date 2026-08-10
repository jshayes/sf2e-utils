import { moduleId } from "../../constants";
import {
  calculatePlanetClockTime,
  getWorldClockTimestamp,
  PLANET_CLOCKS,
  type PlanetClockDefinition,
  type PlanetClockTime,
} from "./planetClocks";

type PlanetView = PlanetClockDefinition & {
  dayLengthLabel: string;
};

type PlanetClockContext = fa.ApplicationRenderContext & {
  planet: PlanetView;
  clock: PlanetClockTime | null;
};

type PlanetClockListContext = fa.ApplicationRenderContext & {
  planets: Array<{
    index: number;
    name: string;
    dayLengthLabel: string;
    hasDayNightCycle: boolean;
  }>;
  hasPlanets: boolean;
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

  readonly planetIndex: number;

  constructor(planetIndex: number) {
    const definition = PLANET_CLOCKS[planetIndex];
    if (!definition) throw new Error(`No planet clock exists at index ${planetIndex}.`);

    super({
      id: `${moduleId}-planet-clock-${planetIndex}`,
      window: {
        title: hasDayNightCycle(definition)
          ? `${definition.name} Clock`
          : definition.name,
      },
    });
    this.planetIndex = planetIndex;
  }

  override async _prepareContext(
    options: fa.ApplicationRenderOptions,
  ): Promise<PlanetClockContext> {
    const context = (await super._prepareContext(
      options,
    )) as fa.ApplicationRenderContext;
    const definition = PLANET_CLOCKS[this.planetIndex];
    if (!definition) throw new Error(`No planet clock exists at index ${this.planetIndex}.`);

    return {
      ...context,
      planet: {
        ...definition,
        dayLengthLabel: getDayLengthLabel(definition),
      },
      clock: hasDayNightCycle(definition)
        ? calculatePlanetClockTime(definition, getWorldClockTimestamp())
        : null,
    };
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
    const planets = PLANET_CLOCKS.map((definition, index) => ({
      index,
      name: definition.name,
      dayLengthLabel: getDayLengthLabel(definition),
      hasDayNightCycle: hasDayNightCycle(definition),
    }));

    return {
      ...context,
      planets,
      hasPlanets: planets.length > 0,
    };
  }

  protected override async _onRender(
    context: fa.ApplicationRenderContext,
    options: foundry.applications.api.HandlebarsRenderOptions,
  ): Promise<void> {
    await super._onRender(context, options);

    for (const button of Array.from(
      this.element.querySelectorAll<HTMLButtonElement>("[data-open-planet-clock]"),
    )) {
      button.addEventListener("click", () => {
        const index = Number.parseInt(button.dataset.openPlanetClock ?? "", 10);
        if (Number.isInteger(index)) void openPlanetClock(index);
      });
    }
  }
}

const planetClockApps = new Map<number, PlanetClockApp>();
let planetClockListApp: PlanetClockListApp | undefined;

export async function openPlanetClockList(): Promise<void> {
  planetClockListApp ??= new PlanetClockListApp();
  await planetClockListApp.render({ force: true });
}

export async function openPlanetClock(planetIndex: number): Promise<void> {
  if (!PLANET_CLOCKS[planetIndex]) return;

  const app = planetClockApps.get(planetIndex) ?? new PlanetClockApp(planetIndex);
  planetClockApps.set(planetIndex, app);
  await app.render({ force: true });
}

export function renderPlanetClocks(): void {
  for (const app of planetClockApps.values()) {
    if (app.rendered) void app.render();
  }
}
