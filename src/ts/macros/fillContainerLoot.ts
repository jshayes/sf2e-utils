type FillContainerLootState = {
  tableId: string;
  targetCount: number;
};

function isDefined<T>(val: T | undefined | null): val is T {
  return !!val;
}

async function resolveDrawnItem(tableResult: foundry.documents.TableResult) {
  const documentUuid = (tableResult as any).documentUuid;
  if (!documentUuid) return null;

  const document = await foundry.utils.fromUuid(documentUuid);
  if (!document || document.documentName !== "Item") return null;

  return document;
}

function parseTargetCount(value: unknown, fallback: number): number {
  const text = String(value ?? "").trim();
  if (!/^\d+$/.test(text)) return fallback;
  return Number.parseInt(text, 10);
}

function parseQuantity(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.floor(value));
  }

  if (typeof value === "string" && /^\d+$/.test(value.trim())) {
    return Number.parseInt(value.trim(), 10);
  }

  return 1;
}

function getItemQuantity(item: foundry.documents.BaseItem) {
  return parseQuantity(foundry.utils.getProperty(item, "system.quantity"));
}

function getItemPer(item: foundry.documents.BaseItem) {
  return parseQuantity(foundry.utils.getProperty(item, "system.price.per"));
}

function getItemSlots(item: foundry.documents.BaseItem) {
  const itemQuantity =
    parseQuantity(foundry.utils.getProperty(item, "system.price.per")) ?? 1;

  return Math.ceil(
    parseQuantity(foundry.utils.getProperty(item, "system.quantity")) /
      itemQuantity,
  );
}

function setItemQuantity(
  itemData: foundry.documents.BaseItem,
  quantity: number,
) {
  const cloned = foundry.utils.deepClone(itemData);
  foundry.utils.setProperty(cloned, "system.quantity", quantity);
  return cloned;
}

function getItemKey(item: foundry.documents.BaseItem): string {
  return `${item.type.toLowerCase()}::${item.name.toLowerCase()}`;
}

async function getActorInventoryQuantity(actor: Actor) {
  return actor.items.map(getItemSlots).reduce((sum, val) => sum + val, 0);
}

async function fillActorFromTable({
  actor,
  table,
  targetCount,
}: {
  actor: Actor;
  table: RollTable;
  targetCount: number;
}) {
  if (!Number.isInteger(targetCount) || targetCount < 0) {
    throw new Error(
      `targetCount must be a non-negative integer. Received: ${targetCount}`,
    );
  }

  const currentQuantity = await getActorInventoryQuantity(actor);
  const missingCount = Math.max(0, targetCount - currentQuantity);

  if (missingCount === 0) {
    return;
  }

  const existingByKey = new Map<string, { id: string; quantity: number }>();
  for (const item of actor.items) {
    const key = getItemKey(item);
    if (existingByKey.has(key)) continue;
    existingByKey.set(key, { id: item.id, quantity: getItemQuantity(item) });
  }

  const updatesById = new Map<string, number>();
  const createdByKey = new Map<string, foundry.documents.BaseItem>();

  const draw = await table.drawMany(missingCount, {
    displayChat: false,
    recursive: false,
  });
  const items = (await Promise.all(draw.results.map(resolveDrawnItem))).filter(
    (x): x is foundry.documents.Item<null> => !!x,
  );

  items.forEach((item) => {
    const key = getItemKey(item);
    const existing = existingByKey.get(key);
    if (existing) {
      existing.quantity += getItemPer(item);
      updatesById.set(existing.id, existing.quantity);
      return;
    }

    const createdItem = createdByKey.get(key);
    if (createdItem) {
      const nextQuantity = getItemQuantity(createdItem) + getItemPer(item);
      createdByKey.set(key, setItemQuantity(createdItem, nextQuantity));
      return;
    }

    createdByKey.set(key, setItemQuantity(item, getItemPer(item)));
  });

  if (updatesById.size > 0) {
    const updates = Array.from(updatesById.entries()).map(([id, quantity]) => ({
      _id: id,
      system: { quantity },
    }));
    await actor.updateEmbeddedDocuments("Item", updates);
  }

  const createdItems = Array.from(createdByKey.values());
  if (createdItems.length > 0) {
    const createdDocuments = (await actor.createEmbeddedDocuments(
      "Item",
      createdItems,
    )) as foundry.documents.Item[];

    await actor.updateEmbeddedDocuments(
      "Item",
      createdDocuments
        .map((d) => {
          const key = getItemKey(d);
          const item = createdByKey.get(key);
          if (!item) return;

          return {
            _id: d.id,
            system: { quantity: getItemQuantity(item) },
          };
        })
        .filter(isDefined),
    );
  }
}

function buildTableOptionsHtml(
  tables: RollTable[],
  selectedTableId: string,
): string {
  return tables
    .map((table) => {
      const selected = table.id === selectedTableId ? " selected" : "";
      return `<option value="${table.id}"${selected}>${foundry.utils.escapeHTML(table.name)}</option>`;
    })
    .join("");
}

function getActor(): Actor {
  const controlled = canvas.tokens.controlled;
  if (controlled.length !== 1) {
    throw new Error(
      `Must select 1 loot container. ${controlled.length} tokens selected.`,
    );
  }

  if (!controlled[0].actor) {
    throw new Error("Loot container could not be found.");
  }

  return controlled[0].actor;
}

export async function fillContainerLoot(): Promise<void> {
  const tables = game.tables.contents.sort((a, b) =>
    a.name.localeCompare(b.name),
  );
  if (!tables.length) {
    throw new Error("No roll tables found in this world.");
  }

  const initialTableId = tables[0].id;
  const initialTargetCount = 1;
  if (!foundry.applications.api.DialogV2) {
    throw new Error("DialogV2 API is unavailable.");
  }

  await foundry.applications.api.DialogV2.wait({
    window: { title: "Fill Container Loot" },
    content: `
      <div class="form-group">
        <label>Roll Table</label>
        <div class="form-fields">
          <select data-fill-loot-table>${buildTableOptionsHtml(tables, initialTableId)}</select>
        </div>
      </div>
      <div class="form-group">
        <label>Target Items</label>
        <div class="form-fields">
          <input type="number" min="0" step="1" value="${initialTargetCount}" data-fill-loot-target />
        </div>
      </div>
      <div class="form-group">
        <button type="button" data-fill-loot-run>Populate Loot</button>
      </div>
    `,
    render: (_event: Event, dialog: { element?: HTMLElement | null }) => {
      const root = dialog.element;
      if (!root) return;

      const tableSelect = root.querySelector("[data-fill-loot-table]");
      const targetInput = root.querySelector("[data-fill-loot-target]");
      const runButton = root.querySelector("[data-fill-loot-run]");

      if (!(tableSelect instanceof HTMLSelectElement)) return;
      if (!(targetInput instanceof HTMLInputElement)) return;
      if (!(runButton instanceof HTMLButtonElement)) return;

      const readState = (): FillContainerLootState => ({
        tableId: tableSelect.value,
        targetCount: parseTargetCount(targetInput.value, 1),
      });

      targetInput.addEventListener("change", () => {
        targetInput.value = String(parseTargetCount(targetInput.value, 1));
      });

      runButton.addEventListener("click", async () => {
        const state = readState();
        const table = game.tables.get(state.tableId);
        if (!table) {
          ui.notifications.error("Selected roll table no longer exists.");
          return;
        }

        const actor = getActor();

        runButton.disabled = true;

        try {
          await fillActorFromTable({
            actor,
            table,
            targetCount: state.targetCount,
          });
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Failed to populate loot.";
          ui.notifications.error(message);
        } finally {
          runButton.disabled = false;
        }
      });
    },
    buttons: [
      {
        action: "close",
        label: "Close",
        default: true,
      },
    ],
    rejectClose: false,
    modal: false,
  });
}
