import { registerEnricher, unregisterEnricher } from "./utils";

const pattern = /@ActivateScene\[(?:"([^"]+)"|(\S+))\]/g;
let clickHandlerRegistered = false;
const clickSelector = "a.sf2e-activate-scene";

async function getScene(
  args?: string,
): Promise<foundry.documents.Scene | null> {
  if (!args) return null;

  const doc = await fromUuid(args);
  if (!(doc && doc instanceof foundry.documents.Scene)) return null;

  return doc ? doc : (game.scenes.getName(args) ?? null);
}

async function enricher(match: RegExpMatchArray): Promise<HTMLElement | null> {
  const scene = await getScene(match[1] ?? match[2]);
  if (!scene) return null;

  const element = document.createElement("span");
  element.classList.add("sf2e-activate-scene");
  element.innerHTML = `<i class="fas fa-panorama"></i> ${scene.name} `;

  const view = document.createElement("a");
  view.classList.add("sf2e-activate-scene");
  view.dataset.action = "view";
  view.dataset.sceneId = scene.uuid ?? "";
  view.innerHTML = "View";

  const activate = document.createElement("a");
  activate.classList.add("sf2e-activate-scene");
  activate.dataset.action = "activate";
  activate.dataset.sceneId = scene.uuid ?? "";
  activate.innerHTML = "Activate";

  element.appendChild(view);
  element.appendChild(activate);
  return element;
}

async function onClick(event: MouseEvent): Promise<void> {
  const target = event.target as HTMLElement | null;
  const link = target?.closest(clickSelector);
  if (!(link instanceof HTMLAnchorElement)) return;

  event.preventDefault();

  try {
    const action = String(link.dataset.action ?? "");
    const sceneId = String(link.dataset.sceneId ?? "");

    const scene = await getScene(sceneId);
    if (!scene) {
      ui.notifications.error(`Scene not found: ${sceneId}`);
      return;
    }

    if (action === "view") {
      await scene.view();
    } else if (action === "activate") {
      await scene.activate();
    }
  } catch (error) {
    ui.notifications.error((error as Error).message);
    throw error;
  }
}

export function registerActivateSceneEnricher(): void {
  registerEnricher({
    pattern,
    enricher,
  });

  if (!clickHandlerRegistered) {
    document.body.addEventListener("click", onClick);
    clickHandlerRegistered = true;
  }
}

export function unregisterActivateSceneEnricher(): void {
  unregisterEnricher(pattern);

  if (clickHandlerRegistered) {
    document.body.removeEventListener("click", onClick);
    clickHandlerRegistered = false;
  }
}
