import {
  windowRegistry,
  type WindowManagerApp,
  type WindowRegistryEntry,
} from "../state/windowRegistry";

let container: HTMLDivElement | null = null;
let input: HTMLInputElement | null = null;
let list: HTMLDivElement | null = null;
let unsubscribe: (() => void) | null = null;
let entries: WindowRegistryEntry[] = [];
type FilteredWindowEntry = {
  entry: WindowRegistryEntry;
  score: number;
  nameScore: number;
  typeScore: number;
  nameMatchIndices: Set<number>;
  typeMatchIndices: Set<number>;
};
let filteredEntries: FilteredWindowEntry[] = [];
let activeIndex = 0;
let suppressHoverUntilMouseMove = false;
let previouslyFocusedElement: HTMLElement | null = null;
let shouldRestorePreviousFocus = false;

function isToggleShortcut(event: KeyboardEvent): boolean {
  return event.code === "Space" && event.ctrlKey && event.shiftKey;
}

function onGlobalKeyDown(event: KeyboardEvent): void {
  if (!container) return;
  if (isToggleShortcut(event)) {
    event.preventDefault();
    event.stopPropagation();
    closeWindowSwitcher();
    return;
  }
  if (event.key !== "Escape") return;
  event.preventDefault();
  event.stopPropagation();
  closeWindowSwitcher();
}

function getSearchValue(): string {
  return String(input?.value ?? "")
    .trim()
    .toLocaleLowerCase();
}

function fuzzyMatch(
  query: string,
  target: string,
): { score: number; indices: number[] } | null {
  if (!query) return { score: 0, indices: [] };

  let score = 0;
  let queryIndex = 0;
  let consecutive = 0;
  const indices: number[] = [];

  for (let i = 0; i < target.length; i += 1) {
    if (queryIndex >= query.length) break;
    if (target[i] !== query[queryIndex]) {
      consecutive = 0;
      continue;
    }

    // Base match score.
    score += 1;

    // Favor consecutive matches.
    consecutive += 1;
    score += consecutive * 2;

    // Favor matches near start and token boundaries.
    if (i === 0 || target[i - 1] === " " || target[i - 1] === "-") {
      score += 6;
    } else if (i < 5) {
      score += 2;
    }

    indices.push(i);
    queryIndex += 1;
  }

  if (queryIndex !== query.length) return null;
  return { score, indices };
}

function pickBestMatch(
  query: string,
  entry: WindowRegistryEntry,
): FilteredWindowEntry | null {
  const name = entry.name.toLocaleLowerCase();
  const type = entry.type.toLocaleLowerCase();

  if (!query) {
    return {
      entry,
      score: 0,
      nameScore: 0,
      typeScore: 0,
      nameMatchIndices: new Set<number>(),
      typeMatchIndices: new Set<number>(),
    };
  }

  const nameMatch = fuzzyMatch(query, name);
  const typeMatch = fuzzyMatch(query, type);
  const combinedMatch = fuzzyMatch(query, `${name} ${type}`);

  const candidates: FilteredWindowEntry[] = [];
  if (nameMatch) {
    candidates.push({
      entry,
      score: nameMatch.score * 2,
      nameScore: nameMatch.score,
      typeScore: 0,
      nameMatchIndices: new Set(nameMatch.indices),
      typeMatchIndices: new Set<number>(),
    });
  }
  if (typeMatch) {
    candidates.push({
      entry,
      score: typeMatch.score,
      nameScore: 0,
      typeScore: typeMatch.score,
      nameMatchIndices: new Set<number>(),
      typeMatchIndices: new Set(typeMatch.indices),
    });
  }
  if (combinedMatch) {
    const nameMatchIndices = new Set<number>();
    const typeMatchIndices = new Set<number>();
    for (const index of combinedMatch.indices) {
      if (index < name.length) {
        nameMatchIndices.add(index);
      } else if (index > name.length) {
        typeMatchIndices.add(index - name.length - 1);
      }
    }
    candidates.push({
      entry,
      score: combinedMatch.score + nameMatchIndices.size * 2,
      nameScore: nameMatchIndices.size,
      typeScore: typeMatchIndices.size,
      nameMatchIndices,
      typeMatchIndices,
    });
  }

  if (candidates.length === 0) return null;
  return candidates.sort((a, b) => b.score - a.score)[0];
}

function renderHighlightedText(
  container: HTMLElement,
  text: string,
  matchIndices: Set<number>,
): void {
  container.replaceChildren();

  if (matchIndices.size === 0) {
    container.innerText = text;
    return;
  }

  for (let i = 0; i < text.length; i += 1) {
    const char = document.createElement("span");
    char.innerText = text[i] ?? "";
    if (matchIndices.has(i)) {
      char.classList.add("sf2e-window-switcher-match");
    }
    container.appendChild(char);
  }
}

function applyFilter(): void {
  const q = getSearchValue();
  const ranked = entries
    .map((entry) => pickBestMatch(q, entry))
    .filter((row): row is FilteredWindowEntry => row !== null)
    .sort(
      (a, b) =>
        b.nameScore - a.nameScore ||
        b.score - a.score ||
        a.entry.name.localeCompare(b.entry.name),
    );
  filteredEntries = ranked;
  if (activeIndex >= filteredEntries.length) {
    activeIndex = Math.max(0, filteredEntries.length - 1);
  }
}

function renderList(): void {
  const listElement = list;
  if (!(listElement instanceof HTMLDivElement)) return;
  listElement.replaceChildren();

  if (filteredEntries.length === 0) {
    const empty = document.createElement("div");
    empty.classList.add("sf2e-window-switcher-empty");
    empty.innerText = "No open windows.";
    listElement.appendChild(empty);
    return;
  }

  filteredEntries.forEach((filteredEntry, index) => {
    const entry = filteredEntry.entry;
    const row = document.createElement("button");
    row.type = "button";
    row.classList.add("sf2e-window-switcher-row");
    if (index === activeIndex) row.classList.add("is-active");
    row.dataset.key = String(entry.key);

    const name = document.createElement("span");
    name.classList.add("sf2e-window-switcher-name");
    renderHighlightedText(name, entry.name, filteredEntry.nameMatchIndices);

    const type = document.createElement("span");
    type.classList.add("sf2e-window-switcher-type");
    renderHighlightedText(type, entry.type, filteredEntry.typeMatchIndices);

    row.appendChild(name);
    row.appendChild(type);

    row.addEventListener("mousemove", () => {
      if (suppressHoverUntilMouseMove) {
        suppressHoverUntilMouseMove = false;
      }
      if (activeIndex === index) return;
      activeIndex = index;
      renderList();
    });
    row.addEventListener("click", () => {
      activeIndex = index;
      focusActiveWindow();
      closeWindowSwitcher();
    });

    listElement.appendChild(row);
  });
}

function refreshEntries(): void {
  entries = windowRegistry.list();
  applyFilter();
  renderList();
}

function cycleActive(delta: number): void {
  if (filteredEntries.length === 0) return;
  activeIndex =
    (activeIndex + delta + filteredEntries.length) % filteredEntries.length;
  renderList();
}

function focusActiveWindow(): void {
  if (filteredEntries.length === 0) return;
  const filteredEntry = filteredEntries[activeIndex];
  if (!filteredEntry) return;
  shouldRestorePreviousFocus = false;
  focusApp(filteredEntry.entry.app);
}

function focusApp(app: WindowManagerApp): void {
  // V2 apps expose bringToFront, while V1 apps expose bringToTop.
  if ("bringToFront" in app && typeof app.bringToFront === "function") {
    app.bringToFront();
  } else if ("bringToTop" in app && typeof app.bringToTop === "function") {
    app.bringToTop();
  }

  if ("maximize" in app && typeof app.maximize === "function") {
    app.maximize();
  }
}

function onFocusOut(): void {
  window.setTimeout(() => {
    if (!container) return;
    const active = document.activeElement;
    if (!active || !container.contains(active)) {
      shouldRestorePreviousFocus = false;
      closeWindowSwitcher();
    }
  }, 0);
}

function onKeyDown(event: KeyboardEvent): void {
  if (isToggleShortcut(event)) {
    event.preventDefault();
    event.stopPropagation();
    closeWindowSwitcher();
    return;
  }
  if (event.key === "Tab") {
    event.preventDefault();
    cycleActive(event.shiftKey ? -1 : 1);
    return;
  }
  if (event.key === "Enter") {
    event.preventDefault();
    focusActiveWindow();
    closeWindowSwitcher();
    return;
  }
  if (event.key === "Escape") {
    event.preventDefault();
    event.stopPropagation();
    closeWindowSwitcher();
    return;
  }
  if (event.key === "ArrowDown") {
    event.preventDefault();
    cycleActive(1);
    return;
  }
  if (event.key === "ArrowUp") {
    event.preventDefault();
    cycleActive(-1);
  }
}

function positionWindowSwitcher(): void {
  if (!container) return;
  const margin = 16;
  const { height } = container.getBoundingClientRect();
  const top = Math.max(margin, Math.floor((window.innerHeight - height) / 2));
  container.style.top = `${top}px`;
}

export function openWindowSwitcher(): void {
  if (container) {
    input?.focus();
    input?.select();
    return;
  }

  previouslyFocusedElement =
    document.activeElement instanceof HTMLElement ? document.activeElement : null;
  shouldRestorePreviousFocus = true;

  container = document.createElement("div");
  container.classList.add("sf2e-window-switcher", "application");
  container.tabIndex = -1;
  container.addEventListener("focusout", onFocusOut);

  input = document.createElement("input");
  input.type = "text";
  input.classList.add("sf2e-window-switcher-input");
  input.placeholder = "Search windows...";
  input.addEventListener("input", () => {
    activeIndex = 0;
    suppressHoverUntilMouseMove = true;
    applyFilter();
    renderList();
  });
  input.addEventListener("keydown", onKeyDown);

  list = document.createElement("div");
  list.classList.add("sf2e-window-switcher-list");

  container.appendChild(input);
  container.appendChild(list);
  document.body.appendChild(container);
  document.addEventListener("keydown", onGlobalKeyDown, true);

  unsubscribe = windowRegistry.subscribe(() => {
    refreshEntries();
  });

  refreshEntries();
  positionWindowSwitcher();
  input.focus();
  input.select();
}

export function closeWindowSwitcher(): void {
  const focusTarget =
    shouldRestorePreviousFocus &&
    previouslyFocusedElement instanceof HTMLElement &&
    previouslyFocusedElement.isConnected
      ? previouslyFocusedElement
      : null;

  document.removeEventListener("keydown", onGlobalKeyDown, true);
  unsubscribe?.();
  unsubscribe = null;
  container?.remove();
  container = null;
  input = null;
  list = null;
  entries = [];
  filteredEntries = [];
  activeIndex = 0;
  suppressHoverUntilMouseMove = false;
  previouslyFocusedElement = null;
  shouldRestorePreviousFocus = false;

  if (focusTarget) {
    window.setTimeout(() => {
      focusTarget.focus({ preventScroll: true });
    }, 0);
  }
}

export function isWindowSwitcherOpen(): boolean {
  return container instanceof HTMLDivElement;
}
