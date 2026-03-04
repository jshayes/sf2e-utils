<script lang="ts">
  import { moduleId } from "../../../constants";
  import "./RadialMenuEditorApp.css";

  type EditorRow = {
    id: number;
    image: string;
    folderId: string;
  };

  type SavedRow = {
    folder: string;
    image?: string;
  };

  const flagKey = "radial-menu.rows";

  function createEmptyRow(id: number): EditorRow {
    return {
      id,
      image: "",
      folderId: "",
    };
  }

  function getSavedRows(): EditorRow[] {
    const savedRows = game.user.getFlag(moduleId, flagKey);
    if (!Array.isArray(savedRows) || savedRows.length === 0) {
      return [createEmptyRow(1)];
    }

    return savedRows.slice(0, 14).map((row, index) => {
      const value = row as Partial<SavedRow> | null | undefined;
      return {
        id: index + 1,
        image: typeof value?.image === "string" ? value.image : "",
        folderId: typeof value?.folder === "string" ? value.folder : "",
      };
    });
  }

  type FilePickerConstructor = new (options: {
    type: "image";
    current: string;
    callback: (path: string) => void;
  }) => {
    render: (show?: boolean) => void;
  };

  let nextRowId = 2;
  let rows = $state<EditorRow[]>(getSavedRows());
  nextRowId = rows.length + 1;

  function addRow(): void {
    if (rows.length >= 14) {
      ui.notifications.error(
        "Cannot add more than 14 folders to the radial menu.",
      );
      return;
    }

    rows.push({
      id: nextRowId++,
      image: "",
      folderId: "",
    });
  }

  function removeRow(rowId: number): void {
    const index = rows.findIndex((row) => row.id === rowId);
    if (index === -1) return;
    rows.splice(index, 1);
  }

  async function browseImage(row: EditorRow): Promise<void> {
    const Picker = (
      globalThis as {
        FilePicker?: FilePickerConstructor;
      }
    ).FilePicker;

    if (!Picker) {
      ui.notifications.warn("FilePicker is not available in this client.");
      return;
    }

    const nextPath = await new Promise<string | null>((resolve) => {
      const picker = new Picker({
        type: "image",
        current: row.image,
        callback: (path: string) => resolve(path),
      });

      picker.render(true);
    });

    if (nextPath) {
      row.image = nextPath;
    }
  }

  function getFolders() {
    return game.folders
      .filter((x) => x.type === "Macro")
      .map((x) => ({ id: x.id, name: x.name }));
  }

  let folders = $state(getFolders());

  function refreshFolders(): void {
    folders = getFolders();
  }

  async function saveRows(): Promise<void> {
    const savedRows: SavedRow[] = rows.map((row) => ({
      folder: row.folderId,
      image: row.image.trim() ? row.image.trim() : undefined,
    }));

    await game.user.setFlag(moduleId, flagKey, savedRows);
    ui.notifications.info("Radial menu rows saved.");
  }
</script>

<div class="radial-menu-editor-app">
  <div class="radial-menu-editor-toolbar">
    <button
      type="button"
      onclick={addRow}
      disabled={rows.length >= 14}
      title={rows.length >= 14 ? "You can only have 14 rows" : undefined}
    >
      <i class="fa-solid fa-plus"></i>
      Add Row
    </button>
  </div>

  <div class="radial-menu-editor-rows">
    {#each rows as row (row.id)}
      <section class="radial-menu-editor-row">
        <div class="form-group">
          <div class="form-fields">
            <select
              id={`radial-menu-row-folder-${row.id}`}
              class="radial-menu-editor-folder-select"
              bind:value={row.folderId}
              onfocus={refreshFolders}
            >
              <option value="">Select a folder</option>
              {#each folders as folder (folder.id)}
                <option value={folder.id}>
                  {folder.name}
                </option>
              {/each}
            </select>
          </div>
        </div>

        <div class="form-group radial-menu-editor-image-fields">
          <div class="form-fields radial-menu-editor-image-fields-contents">
            <input
              id={`radial-menu-row-image-${row.id}`}
              type="text"
              bind:value={row.image}
              placeholder="systems/pf2e/icons/..."
            />
            <button type="button" onclick={() => void browseImage(row)}>
              Browse
            </button>
          </div>
        </div>

        <div class="form-group">
          <div class="form-fields">
            <button
              type="button"
              aria-label="Delete row"
              onclick={() => removeRow(row.id)}
            >
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </div>
      </section>
    {/each}
  </div>

  <div class="radial-menu-editor-toolbar">
    <button
      type="button"
      onclick={() => void saveRows()}
    >
      <i class="fa-solid fa-floppy-disk"></i>
      Save
    </button>
  </div>
</div>
