import { ScenePF2e } from "foundry-pf2e";
import { HooksManager } from "../../../helpers/hooks";

const hooks = new HooksManager();
export function registerSceneHooks() {
  hooks.on(
    "updateScene",
    async (scene: ScenePF2e, diff: DeepPartial<ScenePF2e>) => {
      if (!game.user.isGM) return;
      if (!diff.active) return;
      if (!scene.playlist) return;

      game.playlists.playing.forEach((x) => {
        // @ts-ignore
        if (x.channel !== "music") return;
        if (x.id === scene.playlist?.id) return;

        x.stopAll();
      });
    },
  );
}

export function unregisterSceneHooks() {
  hooks.off();
}
