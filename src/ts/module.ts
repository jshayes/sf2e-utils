// Do not remove this import. If you do Vite will think your styles are dead
// code and not include them in the build output.
import "../styles/style.scss";
import { moduleId } from "./constants";
import { MyModule } from "./types";
import * as helpers from "./helpers";
import * as macros from "./macros";

type GameWithSf2eUtils = typeof game & {
  sf2eUtils?: MyModule["api"];
};

let module: MyModule | undefined;

function initializeModule(): void {
  const currentModule = game.modules.get(moduleId);
  if (!currentModule) return;

  module = currentModule as MyModule;
  module.api = { helpers, macros };
  (game as GameWithSf2eUtils).sf2eUtils = module.api;
}

Hooks.once("init", () => {
  console.log(`Initializing ${moduleId}`);
  initializeModule();
});

if (import.meta.hot) {
  import.meta.hot.accept();
  import.meta.hot.dispose(() => {
    delete (game as GameWithSf2eUtils).sf2eUtils;
  });

  // During HMR, init already ran. Recreate module-scoped instances.
  initializeModule();
}
