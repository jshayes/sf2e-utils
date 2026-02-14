// Do not remove this import. If you do Vite will think your styles are dead
// code and not include them in the build output.
import "../styles/style.scss";
import DogBrowser from "./apps/dogBrowser";
import { moduleId } from "./constants";
import { MyModule } from "./types";

let module: MyModule;

Hooks.once("init", () => {
  console.log(`Initializing ${moduleId}`);

  module = game.modules.get(moduleId)!;
  module.dogBrowser = new DogBrowser();
});

Hooks.on("renderActorDirectory", (_, html) => {
  const button = document.createElement("button");
  button.className = "cc-sidebar-button";
  button.type = "button";
  button.textContent = "🐶";
  button.addEventListener("click", () => {
    module.dogBrowser.render(true);
  });
  html.querySelector(".directory-header .action-buttons")?.append(button);
});
