type MacroScopeInput = {
  sceneName?: unknown;
  activate?: unknown;
};

function parseActivateFlag(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  return (
    String(value ?? "")
      .trim()
      .toLowerCase() === "true"
  );
}

export async function activateSceneByName(
  scope?: MacroScopeInput,
): Promise<void> {
  const sceneName = String(scope?.sceneName ?? "").trim();
  const activate = parseActivateFlag(scope?.activate);

  if (!sceneName) {
    ui.notifications.warn(
      "No scene name provided. Pass scope.sceneName when executing this macro.",
    );
    return;
  }

  const target = sceneName.toLowerCase();
  const scene = game.scenes.find(
    (candidate) =>
      String(candidate.name ?? "")
        .trim()
        .toLowerCase() === target,
  );

  if (!scene) {
    ui.notifications.warn(`Scene not found: ${sceneName}`);
    return;
  }

  if (activate) {
    await scene.activate();
    ui.notifications.info(`Activated scene for all players: ${scene.name}`);
  } else {
    await scene.view();
    ui.notifications.info(`Viewed scene: ${scene.name}`);
  }
}
