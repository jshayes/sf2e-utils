// Do not remove this import. If you do Vite will think your styles are dead
// code and not include them in the build output.
import "../styles/style.scss";
import { moduleId } from "./constants";
import { registerEnrichers, unregisterEnrichers } from "./enrichers";
import * as helpers from "./helpers";
import { registerHideDeadHook } from "./hideDead";
import { registerJournalSkillCheckEditorHooks } from "./journalSkillCheckEditor";
import * as macros from "./macros";
import { MyModule } from "./types";

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

  registerEnrichers();
}

Hooks.once("init", () => {
  console.log(`Initializing ${moduleId}`);
  registerHideDeadHook();
  registerJournalSkillCheckEditorHooks();
  initializeModule();
});

if (import.meta.hot) {
  import.meta.hot.accept();
  import.meta.hot.dispose(() => {
    delete (game as GameWithSf2eUtils).sf2eUtils;
    unregisterEnrichers();
  });

  // During HMR, init already ran. Recreate module-scoped instances.
  initializeModule();
}
