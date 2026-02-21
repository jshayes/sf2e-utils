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
let filteredEntries: WindowRegistryEntry[] = [];
let activeIndex = 0;

function onGlobalKeyDown(event: KeyboardEvent): void {
  if (!container) return;
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

function applyFilter(): void {
  const q = getSearchValue();
  filteredEntries = entries.filter((entry) =>
    `${entry.name} ${entry.type}`.toLocaleLowerCase().includes(q),
  );
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

  filteredEntries.forEach((entry, index) => {
    const row = document.createElement("button");
    row.type = "button";
    row.classList.add("sf2e-window-switcher-row");
    if (index === activeIndex) row.classList.add("is-active");
    row.dataset.key = String(entry.key);

    const name = document.createElement("span");
    name.classList.add("sf2e-window-switcher-name");
    name.innerText = entry.name;

    const type = document.createElement("span");
    type.classList.add("sf2e-window-switcher-type");
    type.innerText = entry.type;

    row.appendChild(name);
    row.appendChild(type);

    row.addEventListener("mouseenter", () => {
      activeIndex = index;
      renderList();
    });
    row.addEventListener("click", () => {
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
  const entry = filteredEntries[activeIndex];
  if (!entry) return;
  focusApp(entry.app);
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
      closeWindowSwitcher();
    }
  }, 0);
}

function onKeyDown(event: KeyboardEvent): void {
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

export function openWindowSwitcher(): void {
  if (container) {
    input?.focus();
    input?.select();
    return;
  }

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
  input.focus();
  input.select();
}

export function closeWindowSwitcher(): void {
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
}
