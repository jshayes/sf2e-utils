import { clickScriptRegionBehaviorType } from "./behavior";

type ClickScriptSystem = {
  source: string;
};

type ClickScriptBehavior = RegionBehavior & {
  system: ClickScriptSystem;
};

type PointerStart = {
  pointerId: number;
  x: number;
  y: number;
};

type PointTestableRegion = RegionDocument & {
  testPoint(point: { x: number; y: number; elevation: number }): boolean;
};

const maximumClickMovement = 6;
const runningBehaviors = new Set<string>();

let board: HTMLElement | null = null;
let pointerStart: PointerStart | null = null;
let canvasReadyHook: number | undefined;
let canvasTearDownHook: number | undefined;

function getTestElevation(region: RegionDocument): number {
  const bottom = region.elevation.bottom;
  const top = region.elevation.top;

  if (typeof bottom === "number" && typeof top === "number") {
    return (bottom + top) / 2;
  }
  if (typeof bottom === "number") return bottom;
  if (typeof top === "number") return top;
  return 0;
}

function isClickScriptBehavior(
  behavior: RegionBehavior,
): behavior is ClickScriptBehavior {
  return (
    behavior.type === clickScriptRegionBehaviorType &&
    behavior.viewed &&
    typeof (behavior.system as Partial<ClickScriptSystem>).source === "string"
  );
}

async function executeBehavior(
  behavior: ClickScriptBehavior,
  event: PointerEvent,
  point: PIXI.Point,
): Promise<void> {
  const behaviorKey = behavior.uuid ?? behavior.id;
  const region = behavior.region;
  if (!behaviorKey || !region || runningBehaviors.has(behaviorKey)) return;
  runningBehaviors.add(behaviorKey);

  try {
    const AsyncFunction = foundry.utils.AsyncFunction as unknown as new (
      ...parameters: string[]
    ) => (...args: unknown[]) => Promise<unknown>;
    const execute = new AsyncFunction(
      "region",
      "behavior",
      "user",
      "event",
      "point",
      `"use strict";\n${behavior.system.source}`,
    );

    await execute.call(
      behavior.system,
      region,
      behavior,
      game.user,
      event,
      point,
    );
  } catch (error) {
    console.error(
      `SF2E Utils | Click script failed for ${behaviorKey}`,
      error,
    );
    ui.notifications.error(
      error instanceof Error ? error.message : String(error),
    );
  } finally {
    runningBehaviors.delete(behaviorKey);
  }
}

async function executeBehaviorsAtPoint(
  event: PointerEvent,
  point: PIXI.Point,
): Promise<void> {
  const scene = canvas.scene;
  if (!scene || canvas.activeLayer === canvas.regions) return;

  for (const region of scene.regions) {
    const regionDocument = region as unknown as PointTestableRegion;
    const elevatedPoint = {
      x: point.x,
      y: point.y,
      elevation: getTestElevation(regionDocument),
    };
    if (!regionDocument.testPoint(elevatedPoint)) continue;

    for (const behavior of region.behaviors) {
      if (!isClickScriptBehavior(behavior)) continue;
      await executeBehavior(behavior, event, point);
    }
  }
}

function onPointerDown(event: PointerEvent): void {
  if (event.button !== 0 || !event.isPrimary) {
    pointerStart = null;
    return;
  }

  pointerStart = {
    pointerId: event.pointerId,
    x: event.clientX,
    y: event.clientY,
  };
}

function onPointerUp(event: PointerEvent): void {
  const start = pointerStart;
  pointerStart = null;

  if (
    !start ||
    start.pointerId !== event.pointerId ||
    event.button !== 0 ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    event.shiftKey
  ) {
    return;
  }

  if (
    Math.hypot(event.clientX - start.x, event.clientY - start.y) >
    maximumClickMovement
  ) {
    return;
  }

  const point = canvas.canvasCoordinatesFromClient({
    x: event.clientX,
    y: event.clientY,
  });
  void executeBehaviorsAtPoint(event, new PIXI.Point(point.x, point.y));
}

function onPointerCancel(): void {
  pointerStart = null;
}

function detachBoardListeners(): void {
  if (!board) return;

  board.removeEventListener("pointerdown", onPointerDown, true);
  board.removeEventListener("pointerup", onPointerUp, true);
  board.removeEventListener("pointercancel", onPointerCancel, true);
  board = null;
  pointerStart = null;
}

function attachBoardListeners(): void {
  detachBoardListeners();

  const canvasElement = document.getElementById("board");
  if (!canvasElement) return;

  board = canvasElement;
  board.addEventListener("pointerdown", onPointerDown, true);
  board.addEventListener("pointerup", onPointerUp, true);
  board.addEventListener("pointercancel", onPointerCancel, true);
}

export function registerClickScriptRegionListener(): void {
  canvasReadyHook ??= Hooks.on("canvasReady", attachBoardListeners);
  canvasTearDownHook ??= Hooks.on("canvasTearDown", detachBoardListeners);

  if (canvas.ready) attachBoardListeners();
}

export function unregisterClickScriptRegionListener(): void {
  if (canvasReadyHook !== undefined) {
    Hooks.off("canvasReady", canvasReadyHook);
    canvasReadyHook = undefined;
  }
  if (canvasTearDownHook !== undefined) {
    Hooks.off("canvasTearDown", canvasTearDownHook);
    canvasTearDownHook = undefined;
  }

  detachBoardListeners();
  runningBehaviors.clear();
}
