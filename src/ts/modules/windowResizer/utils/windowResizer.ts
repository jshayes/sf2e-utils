type WindowResizerApp =
  | foundry.applications.api.ApplicationV2
  | foundry.appv1.api.Application;

type PositionState = {
  left?: number;
  top?: number;
  width?: number;
  height?: number;
  scale?: number;
};

type ExpandedWindowState = {
  restorePosition: PositionState;
  baselineSize: Pick<PositionState, "width" | "height" | "scale">;
};

const expandedWindows = new WeakMap<WindowResizerApp, ExpandedWindowState>();
const appKeydownHandlers = new WeakMap<
  WindowResizerApp,
  (event: KeyboardEvent) => void
>();
const baselineSizesByKey = new Map<
  string,
  Pick<PositionState, "width" | "height" | "scale">
>();

function isApplicationV2(
  app: unknown,
): app is foundry.applications.api.ApplicationV2 {
  return app instanceof foundry.applications.api.ApplicationV2;
}

function isApplicationV1(app: unknown): app is foundry.appv1.api.Application {
  return app instanceof foundry.appv1.api.Application;
}

function asWindowResizerApp(app: unknown): WindowResizerApp | null {
  if (!isApplicationV2(app) && !isApplicationV1(app)) return null;
  if (typeof app.setPosition !== "function") return null;
  if (isApplicationV2(app) && !app.hasFrame) return null;

  const popOut = (app as { options?: { popOut?: boolean } }).options?.popOut;
  if (popOut === false) return null;
  return app;
}

function toNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function getCurrentPosition(app: WindowResizerApp): PositionState {
  const position =
    (app as unknown as { position?: Record<string, unknown> }).position ?? {};
  return {
    left: toNumber(position.left),
    top: toNumber(position.top),
    width: toNumber(position.width),
    height: toNumber(position.height),
    scale: toNumber(position.scale),
  };
}

function getAppKey(app: WindowResizerApp): string {
  const id = String(app.id ?? "");
  const ctor = String(app.constructor?.name ?? "App");
  if (id) return `${ctor}:${id}`;
  return ctor;
}

function getConfiguredBaselineSize(
  app: WindowResizerApp,
): Pick<PositionState, "width" | "height" | "scale"> {
  if (isApplicationV2(app)) {
    const width = toNumber(app.options.position.width);
    const height = toNumber(app.options.position.height);
    const scale = toNumber(app.options.position.scale);
    return { width, height, scale };
  }

  const options = app.options as unknown as Record<string, unknown>;
  const width = toNumber(options.width);
  const height = toNumber(options.height);
  const scale = toNumber(options.scale);
  return { width, height, scale };
}

function getBaselineSize(
  app: WindowResizerApp,
): Pick<PositionState, "width" | "height" | "scale"> {
  const key = getAppKey(app);
  const existing = baselineSizesByKey.get(key);
  if (existing) return existing;

  const configured = getConfiguredBaselineSize(app);
  const current = getCurrentPosition(app);
  const baseline = {
    width: configured.width ?? current.width,
    height: configured.height ?? current.height,
    scale: configured.scale ?? current.scale,
  };
  baselineSizesByKey.set(key, baseline);
  return baseline;
}

function getExpandedPosition(): PositionState {
  const marginLeft = 24;
  const marginRight = 24;
  const sidebarWidth = 348;
  const marginY = 40;
  const availableWidth = Math.max(
    320,
    window.innerWidth - marginLeft - marginRight - sidebarWidth,
  );
  const maxWidth = Math.max(320, availableWidth);
  const maxHeight = Math.max(240, window.innerHeight - marginY * 2);
  const width = Math.min(
    maxWidth,
    Math.max(640, Math.floor(availableWidth * 0.92)),
  );
  const height = Math.min(
    maxHeight,
    Math.max(420, Math.floor(window.innerHeight * 0.85)),
  );
  const left = Math.max(
    marginLeft,
    Math.round(marginLeft + (availableWidth - width) / 2),
  );
  return {
    width,
    height,
    left,
    top: Math.max(16, Math.round((window.innerHeight - height) / 2)),
  };
}

function isAtExpandedSize(
  position: PositionState,
  expanded: PositionState,
): boolean {
  const width = position.width;
  const height = position.height;
  if (width === undefined || height === undefined) return false;
  if (expanded.width === undefined || expanded.height === undefined)
    return false;
  const tolerance = 2;
  return (
    Math.abs(width - expanded.width) <= tolerance &&
    Math.abs(height - expanded.height) <= tolerance
  );
}

function setPosition(app: WindowResizerApp, position: PositionState): void {
  if (isApplicationV2(app)) {
    app.setPosition(position as Partial<fa.ApplicationPosition>);
    return;
  }
  const v1Position = position as Partial<foundry.appv1.api.ApplicationPosition>;
  app.setPosition(v1Position);

  const hasResize =
    position.width !== undefined || position.height !== undefined;
  const hasMove = position.left !== undefined || position.top !== undefined;
  if (!hasResize || !hasMove) return;

  // V1 sometimes ignores left/top when size and position change together.
  window.requestAnimationFrame(() => {
    app.setPosition({
      left: position.left,
      top: position.top,
    } as Partial<foundry.appv1.api.ApplicationPosition>);
  });
}

function focusApp(app: WindowResizerApp): void {
  if ("bringToFront" in app && typeof app.bringToFront === "function") {
    app.bringToFront();
  } else if ("bringToTop" in app && typeof app.bringToTop === "function") {
    app.bringToTop();
  }
}

function getRootElement(app: WindowResizerApp): HTMLElement | null {
  const element = (app as { element?: unknown }).element;
  if (element instanceof HTMLElement) return element;
  if (element && typeof element === "object") {
    const maybeCollection = element as { 0?: unknown };
    if (maybeCollection[0] instanceof HTMLElement) {
      return maybeCollection[0];
    }
  }
  return null;
}

function isResizableWindow(app: WindowResizerApp): boolean {
  if (isApplicationV2(app)) {
    return app.options.window.resizable !== false;
  }
  return (app.options as { resizable?: boolean }).resizable !== false;
}

export function toggleWindowSize(appInput: unknown): boolean {
  const app = asWindowResizerApp(appInput);
  if (!app) return false;
  if (!isResizableWindow(app)) return false;

  const expandedPosition = getExpandedPosition();
  const currentPosition = getCurrentPosition(app);
  const baselineSize = getBaselineSize(app);

  const state = expandedWindows.get(app);
  if (state) {
    expandedWindows.delete(app);
    setPosition(app, {
      ...state.restorePosition,
      ...state.baselineSize,
    });
    focusApp(app);
    return true;
  }

  if (isAtExpandedSize(currentPosition, expandedPosition)) {
    setPosition(app, {
      ...currentPosition,
      ...baselineSize,
    });
    focusApp(app);
    return true;
  }

  expandedWindows.set(app, {
    restorePosition: currentPosition,
    baselineSize,
  });
  setPosition(app, expandedPosition);
  focusApp(app);
  return true;
}

export function toggleActiveWindowSize(): boolean {
  const activeWindow = (ui as unknown as { activeWindow?: unknown })
    .activeWindow;
  return toggleWindowSize(activeWindow);
}

export function clearWindowSizeState(appInput: unknown): void {
  const app = asWindowResizerApp(appInput);
  if (!app) return;
  expandedWindows.delete(app);
}

export function attachAppKeydownListener(
  appInput: unknown,
  handler: (event: KeyboardEvent) => void,
): void {
  const app = asWindowResizerApp(appInput);
  if (!app) return;

  const root = getRootElement(app);
  if (!(root instanceof HTMLElement)) return;

  detachAppKeydownListener(app);

  const wrapped = (event: KeyboardEvent): void => {
    const target = event.target;
    if (!(target instanceof Node)) return;
    if (!root.contains(target)) return;
    handler(event);
  };

  root.addEventListener("keydown", wrapped, true);
  appKeydownHandlers.set(app, wrapped);
}

export function detachAppKeydownListener(appInput: unknown): void {
  const app = asWindowResizerApp(appInput);
  if (!app) return;

  const root = getRootElement(app);
  if (!(root instanceof HTMLElement)) return;

  const existing = appKeydownHandlers.get(app);
  if (!existing) return;

  root.removeEventListener("keydown", existing, true);
  appKeydownHandlers.delete(app);
}

export function attachResizeHeaderButton(appInput: unknown): void {
  const app = asWindowResizerApp(appInput);
  if (!app) return;
  if (!isResizableWindow(app)) return;
  getBaselineSize(app);

  const root = getRootElement(app);
  if (!(root instanceof HTMLElement)) return;

  const header = root.querySelector<HTMLElement>(".window-header");
  if (!(header instanceof HTMLElement)) return;
  if (header.querySelector(".sf2e-window-resizer-control")) return;

  const button = isApplicationV1(app)
    ? document.createElement("a")
    : document.createElement("button");
  if (button instanceof HTMLButtonElement) {
    button.type = "button";
    button.classList.add("header-control");
  } else {
    button.classList.add("header-button", "control");
  }
  button.classList.add("sf2e-window-resizer-control");
  button.setAttribute("data-action", "sf2e-window-resizer-toggle");
  button.setAttribute("aria-label", "Toggle Window Size");
  button.title = "Toggle Window Size";
  button.innerHTML =
    '<i class="fa-solid fa-up-right-and-down-left-from-center" inert></i>';
  const swallowEvent = (event: Event): void => {
    event.preventDefault();
    event.stopPropagation();
    if ("stopImmediatePropagation" in event) {
      event.stopImmediatePropagation();
    }
  };
  if (isApplicationV1(app)) {
    button.addEventListener("pointerdown", swallowEvent, { capture: true });
    button.addEventListener("mousedown", swallowEvent, { capture: true });
  }
  button.addEventListener(
    "click",
    (event) => {
      swallowEvent(event);
      toggleWindowSize(app);
    },
    { capture: true },
  );

  const closeButton = header.querySelector<HTMLElement>(
    '[data-action="close"], .header-button.close',
  );

  if (closeButton?.parentElement === header) {
    header.insertBefore(button, closeButton);
  } else {
    header.appendChild(button);
  }
}
