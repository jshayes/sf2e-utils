import { moduleId } from "../constants";

const LEGACY_SCOPE = "world";
const FLAG_KEY = "af-named-positions";

type NamedPosition = {
  x: number;
  y: number;
  elevation?: number;
  tokenId?: string;
};

type NamedPositionMap = Record<string, NamedPosition>;

type MacroScopeInput = {
  positionName?: unknown;
  name?: unknown;
};

function readNamedPositions(doc: TokenDocument): NamedPositionMap {
  const current = (doc.getFlag(moduleId, FLAG_KEY) ?? {}) as NamedPositionMap;
  const legacy = (doc.getFlag(LEGACY_SCOPE, FLAG_KEY) ??
    {}) as NamedPositionMap;
  return foundry.utils.mergeObject(
    foundry.utils.deepClone(legacy),
    foundry.utils.deepClone(current),
    { inplace: false },
  ) as NamedPositionMap;
}

function resolveName(input?: MacroScopeInput): string | null {
  const fromScopePositionName =
    typeof input?.positionName === "string" ? input.positionName.trim() : "";
  const fromScopeName =
    typeof input?.name === "string" ? input.name.trim() : "";
  return fromScopePositionName || fromScopeName || null;
}

export async function loadNamedPosition(
  scope?: MacroScopeInput,
): Promise<void> {
  const docs = canvas.tokens.placeables.map((token) => token.document);
  if (!docs.length) {
    ui.notifications.warn("No tokens found in the current scene.");
    return;
  }

  const nameSet = new Set<string>();
  for (const doc of docs) {
    const positions = readNamedPositions(doc);
    for (const [name, pos] of Object.entries(positions)) {
      if (!pos || typeof pos !== "object") continue;
      if (pos.tokenId !== doc.id) continue;
      if (typeof pos.x !== "number" || typeof pos.y !== "number") continue;
      nameSet.add(name);
    }
  }

  const names = Array.from(nameSet).sort((a, b) => a.localeCompare(b));
  if (!names.length) {
    ui.notifications.warn(
      "No saved named positions found on tokens for this scene.",
    );
    return;
  }

  const options = names
    .map(
      (name) =>
        `<option value="${foundry.utils.escapeHTML(name)}">${foundry.utils.escapeHTML(name)}</option>`,
    )
    .join("");

  let name = resolveName(scope);
  if (!name) {
    if (!foundry.applications.api.DialogV2) {
      throw new Error("DialogV2 API is unavailable.");
    }

    name = (await foundry.applications.api.DialogV2.prompt({
      window: { title: "Apply Named Position" },
      content: `
        <div class="form-group">
          <label>Position Name</label>
          <select name="positionName">${options}</select>
        </div>
      `,
      ok: {
        label: "Apply",
        callback: (_event: Event, button: unknown): string => {
          const form = (button as { form?: HTMLFormElement }).form;
          const elements = form?.elements as
            | (HTMLFormControlsCollection & {
                positionName?: HTMLSelectElement;
              })
            | undefined;
          return String(elements?.positionName?.value ?? "").trim();
        },
      },
      rejectClose: false,
      modal: true,
    })) as string | null;
  }

  if (!name) {
    ui.notifications.warn("Position apply canceled.");
    return;
  }

  const updates: {
    doc: TokenDocument;
    movementAction: string | null | undefined;
    x: number;
    y: number;
    elevation: number;
  }[] = [];
  const afterUpdates: {
    _id: string;
    movementAction: string | null | undefined;
  }[] = [];

  for (const doc of docs) {
    const pos = readNamedPositions(doc)[name];
    if (!pos || typeof pos.x !== "number" || typeof pos.y !== "number")
      continue;
    if (pos.tokenId !== doc.id) continue;

    updates.push({
      doc,
      movementAction: doc.movementAction,
      x: pos.x,
      y: pos.y,
      elevation:
        typeof pos.elevation === "number"
          ? pos.elevation
          : (doc.elevation ?? 0),
    });
    afterUpdates.push({
      _id: doc.id,
      movementAction: doc.movementAction,
    });
  }

  if (!updates.length) {
    ui.notifications.warn(`No valid "${name}" position found to apply.`);
    return;
  }

  await canvas.scene?.updateEmbeddedDocuments(
    "Token",
    updates.map((x) => ({ _id: x.doc.id, movementAction: "blink" })),
  );

  try {
    await Promise.all(
      updates.map((x) =>
        x.doc.move(
          { x: x.x, y: x.y, elevation: x.elevation },
          { constrainOptions: { ignoreWalls: true } },
        ),
      ),
    );
  } catch (error) {
    console.error(error);
    ui.notifications.error((error as Error).message);
  }

  await canvas.scene?.updateEmbeddedDocuments("Token", afterUpdates);

  ui.notifications.info(
    `Applied position "${name}" to ${updates.length} token(s).`,
  );
}
