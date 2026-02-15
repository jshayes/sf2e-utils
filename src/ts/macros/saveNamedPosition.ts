import { moduleId } from "../constants";

const LEGACY_SCOPE = "world";
const FLAG_KEY = "af-named-positions";

type NamedPosition = {
  x: number;
  y: number;
  elevation: number;
  tokenId: string;
};

type NamedPositionMap = Record<string, NamedPosition>;

function readNamedPositions(doc: TokenDocument): NamedPositionMap {
  const current = (doc.getFlag(moduleId, FLAG_KEY) ?? {}) as NamedPositionMap;
  const legacy = (doc.getFlag(LEGACY_SCOPE, FLAG_KEY) ?? {}) as NamedPositionMap;
  return foundry.utils.mergeObject(
    foundry.utils.deepClone(legacy),
    foundry.utils.deepClone(current),
    { inplace: false },
  ) as NamedPositionMap;
}

export async function saveNamedPosition(): Promise<void> {
  const docs = canvas.tokens.controlled.map((token) => token.document);
  if (!docs.length) {
    ui.notifications.warn("Select at least one token first.");
    return;
  }

  const nameSet = new Set<string>();
  for (const doc of docs) {
    const positions = readNamedPositions(doc);
    for (const name of Object.keys(positions)) {
      nameSet.add(name);
    }
  }

  const existingNames = Array.from(nameSet).sort((a, b) => a.localeCompare(b));
  const existingOptions = [
    `<option value="">-- Create New --</option>`,
    ...existingNames.map(
      (name) =>
        `<option value="${foundry.utils.escapeHTML(name)}">${foundry.utils.escapeHTML(name)}</option>`,
    ),
  ].join("");

  if (!foundry.applications.api.DialogV2) {
    throw new Error("DialogV2 API is unavailable.");
  }

  const name = (await foundry.applications.api.DialogV2.prompt({
    window: { title: "Save Named Position" },
    content: `
      <div class="form-group">
        <label>Existing Position</label>
        <select name="existingName">${existingOptions}</select>
        <p class="hint">Choose one to update, or leave blank and enter a new name.</p>
      </div>
      <div class="form-group" data-new-name-wrap>
        <label>Position Name</label>
        <input type="text" name="positionName" placeholder="e.g. spawn, cover-a, retreat" />
        <p class="hint">If provided, this creates/updates this name instead of the selected existing one.</p>
      </div>
    `,
    ok: {
      label: "Save Position",
      callback: (_event: Event, button: unknown): string => {
        const form = (button as { form?: HTMLFormElement }).form;
        const elements = form?.elements as
          | (HTMLFormControlsCollection & {
              positionName?: HTMLInputElement;
              existingName?: HTMLSelectElement;
            })
          | undefined;
        const typed = String(elements?.positionName?.value ?? "").trim();
        const selected = String(elements?.existingName?.value ?? "").trim();
        return typed || selected;
      },
    },
    render: (_event: Event, dialog: { element?: HTMLElement | null }) => {
      const root = dialog.element;
      const select = root?.querySelector('select[name="existingName"]');
      const wrap = root?.querySelector("[data-new-name-wrap]");
      const input = root?.querySelector('input[name="positionName"]');
      if (
        !(select instanceof HTMLSelectElement) ||
        !(wrap instanceof HTMLElement) ||
        !(input instanceof HTMLInputElement)
      ) {
        return;
      }

      const toggle = () => {
        const show = select.value === "";
        wrap.style.display = show ? "" : "none";
        input.disabled = !show;
        if (!show) input.value = "";
      };

      select.addEventListener("change", toggle);
      toggle();
    },
    rejectClose: false,
    modal: true,
  })) as string | null;

  if (!name) {
    ui.notifications.warn(
      "Position save canceled. Select an existing name or enter a new one.",
    );
    return;
  }

  let updated = 0;
  for (const doc of docs) {
    const allPositions = readNamedPositions(doc);
    allPositions[name] = {
      x: doc.x,
      y: doc.y,
      elevation: doc.elevation ?? 0,
      tokenId: doc.id,
    };
    await doc.setFlag(moduleId, FLAG_KEY, allPositions);
    updated += 1;
  }

  ui.notifications.info(`Saved position "${name}" for ${updated} token(s).`);
}
