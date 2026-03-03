import { mount, unmount } from "svelte";
import { moduleId } from "../../../constants";
import RadialMenuApp from "../ui/RadialMenuApp.svelte";

let app: ReturnType<typeof mount> | null = null;
let container: HTMLDivElement | null = null;
let hostElement: HTMLDivElement | null = null;

function ensureContainer(): HTMLDivElement {
  if (hostElement?.isConnected) return hostElement;

  container = document.createElement("div");
  container.id = `${moduleId}-radial-menu-root`;
  Object.assign(container.style, {
    position: "fixed",
    inset: "0",
    display: "grid",
    placeItems: "center",
    zIndex: "80",
    pointerEvents: "none",
  });

  const blocker = document.createElement("div");
  blocker.style.position = "absolute";
  blocker.style.inset = "0";
  blocker.style.pointerEvents = "auto";
  blocker.addEventListener("click", () => {
    closeRadialMenuApp();
  });

  hostElement = document.createElement("div");
  hostElement.style.position = "relative";
  hostElement.style.pointerEvents = "auto";

  container.append(blocker, hostElement);
  document.body.append(container);

  return hostElement;
}

export function openRadialMenuApp(): void {
  if (app) return;

  const host = ensureContainer();
  app = mount(RadialMenuApp, {
    target: host,
    props: {
      title: "Radial Menu Boilerplate",
      onClose: () => closeRadialMenuApp(),
    },
  });
}

export function closeRadialMenuApp(): void {
  if (app) {
    unmount(app);
    app = null;
  }

  if (container) {
    container.remove();
    container = null;
  }

  hostElement = null;
}
