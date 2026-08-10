export type PlanetClockLocation = {
  id: string;
  name: string;
  /** Offset from the planet's standard time. Both values may be negative. */
  offset: {
    hours: number;
    minutes: number;
  };
  gravity?: string;
  atmosphere?: string;
};

export type PlanetClockDefinition = {
  id: string;
  name: string;
  gravity?: string;
  atmosphere?: string;
  dayLength?: {
    hours: number;
    minutes: number;
  };
  /** Unix timestamp, in seconds, at which this planet's local time was midnight. */
  epoch?: number;
  locations?: PlanetClockLocation[];
};

export function createDefaultLocation(): PlanetClockLocation {
  return {
    id: "standard",
    name: "Default",
    offset: { hours: 0, minutes: 0 },
  };
}

export function getPlanetLocations(
  definition: PlanetClockDefinition,
): PlanetClockLocation[] {
  return definition.locations?.length
    ? definition.locations
    : [createDefaultLocation()];
}

export const DEFAULT_PLANET_CLOCKS: PlanetClockDefinition[] = [
  {
    id: "pact-standard",
    name: "Pact Standard",
    dayLength: { hours: 24, minutes: 0 },
    atmosphere: "Normal",
    gravity: "Standard",
  },
  {
    id: "aballon",
    name: "Aballon",
    dayLength: { hours: 12, minutes: 0 },
    atmosphere: "Thin (in places)",
    gravity: "1/3",
  },
  {
    id: "absalom-station",
    name: "Absalom Station",
    dayLength: { hours: 24, minutes: 0 },
    atmosphere: "Normal",
    gravity: "Standard",
  },
  {
    id: "akiton",
    name: "Akiton",
    dayLength: { hours: 24, minutes: 40 },
    atmosphere: "Thin",
    gravity: "1/3",
  },
  {
    id: "verces",
    name: "Verces",
    dayLength: { hours: 0, minutes: 0 },
    atmosphere: "Normal",
    gravity: "Standard",
  },
  {
    id: "idari",
    name: "Idari",
    dayLength: { hours: 27, minutes: 0 },
    atmosphere: "Normal",
    gravity: "1.5",
  },
  {
    id: "eox",
    name: "Eox",
    dayLength: { hours: 24 * 30, minutes: 0 },
    atmosphere: "Thin and toxic",
    gravity: "Standard",
  },
  {
    id: "triaxus",
    name: "Triaxus",
    dayLength: { hours: 24, minutes: 0 },
    atmosphere: "Normal",
    gravity: "Standard",
  },
  {
    id: "liavara",
    name: "Liavara",
    dayLength: { hours: 72, minutes: 0 },
    atmosphere: "Dense, unbreathable",
    gravity: "High",
  },
  {
    id: "bretheda",
    name: "Bretheda",
    dayLength: { hours: 144, minutes: 0 },
    atmosphere: "Special",
    gravity: "2-1/2",
  },
  {
    id: "apostae",
    name: "Apostae",
    dayLength: { hours: 7 * 24, minutes: 0 },
    atmosphere: "Normal or none",
    gravity: "1/10",
  },
].map((definition) => ({
  ...definition,
  locations: [createDefaultLocation()],
}));

type DayPhase = {
  name: "Midnight" | "Dawn" | "Noon" | "Twilight";
  fraction: number;
};

export type PlanetClockTime = {
  localTime: string;
  period: "Night" | "Morning" | "Afternoon" | "Evening";
  progress: number;
  keyTimes: Array<DayPhase & { time: string }>;
  nextKeyTime: {
    name: DayPhase["name"];
    time: string;
    remaining: string;
  };
};

const DAY_PHASES: DayPhase[] = [
  { name: "Midnight", fraction: 0 },
  { name: "Dawn", fraction: 0.25 },
  { name: "Noon", fraction: 0.5 },
  { name: "Twilight", fraction: 0.75 },
];

const KEY_TIMES: DayPhase[] = [
  ...DAY_PHASES,
  { name: "Midnight", fraction: 1 },
];

function positiveModulo(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}

function formatTime(seconds: number, includeSeconds: boolean): string {
  const wholeSeconds = Math.floor(seconds);
  const hours = Math.floor(wholeSeconds / 3600);
  const minutes = Math.floor((wholeSeconds % 3600) / 60);
  const remainingSeconds = wholeSeconds % 60;
  const base = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  return includeSeconds
    ? `${base}:${String(remainingSeconds).padStart(2, "0")}`
    : base;
}

export function getWorldClockTimestamp(): number {
  const createdOn = game.pf2e.settings.worldClock.worldCreatedOn;
  const createdAt = Date.parse(createdOn ?? "") / 1000;
  return (Number.isFinite(createdAt) ? createdAt : 0) + game.time.worldTime;
}

export function calculatePlanetClockTime(
  definition: PlanetClockDefinition,
  timestamp = getWorldClockTimestamp(),
  location?: PlanetClockLocation,
): PlanetClockTime {
  const dayLength = definition.dayLength ?? { hours: 0, minutes: 0 };
  const dayLengthSeconds = Math.trunc(
    (dayLength.hours * 60 + dayLength.minutes) * 60,
  );
  if (dayLengthSeconds <= 0) {
    throw new Error(
      `Planet clock "${definition.name}" must have a positive day length.`,
    );
  }

  const offsetSeconds = location
    ? (location.offset.hours * 60 + location.offset.minutes) * 60
    : 0;
  const localSeconds = positiveModulo(
    timestamp - (definition.epoch ?? 0) + offsetSeconds,
    dayLengthSeconds,
  );
  const phaseIndex = Math.floor(
    (localSeconds / dayLengthSeconds) * DAY_PHASES.length,
  );
  const nextPhaseIndex = (phaseIndex + 1) % DAY_PHASES.length;
  const nextPhase = DAY_PHASES[nextPhaseIndex];
  const nextPhaseSeconds = nextPhase.fraction * dayLengthSeconds;
  const remainingSeconds = positiveModulo(
    nextPhaseSeconds - localSeconds,
    dayLengthSeconds,
  );

  return {
    localTime: formatTime(localSeconds, true),
    period: ["Night", "Morning", "Afternoon", "Evening"][
      phaseIndex
    ] as PlanetClockTime["period"],
    progress: (localSeconds / dayLengthSeconds) * 100,
    keyTimes: KEY_TIMES.map((phase) => ({
      ...phase,
      time: formatTime(phase.fraction * dayLengthSeconds, false),
    })),
    nextKeyTime: {
      name: nextPhase.name,
      time: formatTime(nextPhaseSeconds, false),
      remaining: formatTime(remainingSeconds, true),
    },
  };
}
