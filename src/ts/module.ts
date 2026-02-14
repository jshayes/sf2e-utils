// Do not remove this import. If you do Vite will think your styles are dead
// code and not include them in the build output.
import "../styles/style.scss";
import DogBrowser from "./apps/dogBrowser";
import { moduleId } from "./constants";
import { MyModule } from "./types";

let module: MyModule | undefined;
let renderActorDirectoryHookId: number | undefined;

function initializeModule(): void {
  const currentModule = game.modules.get(moduleId);
  if (!currentModule) return;

  module = currentModule as MyModule;
  module.dogBrowser = new DogBrowser();
}

function onRenderActorDirectory(_: unknown, html: HTMLElement): void {
  if (!module) initializeModule();
  if (!module) return;

  const button = document.createElement("button");
  button.className = "cc-sidebar-button";
  button.type = "button";
  button.textContent = "🐶 ssd";
  button.addEventListener("click", () => {
    module?.dogBrowser.render(true);
  });
  html.querySelector(".directory-header .action-buttons")?.append(button);
}

Hooks.once("init", () => {
  console.log(`Initializing ${moduleId}`);
  initializeModule();
});

renderActorDirectoryHookId = Hooks.on("renderActorDirectory", onRenderActorDirectory);

if (import.meta.hot) {
  import.meta.hot.accept();
  import.meta.hot.dispose(() => {
    if (renderActorDirectoryHookId !== undefined) {
      Hooks.off("renderActorDirectory", renderActorDirectoryHookId);
    }
  });

  // During HMR, init already ran. Recreate module-scoped instances.
  initializeModule();
}
