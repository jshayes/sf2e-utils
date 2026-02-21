import {
  getPartyDC,
  getSkillOptions,
  skillLabelToSlug,
} from "../../../helpers";
import { HooksManager } from "../../../helpers/hooks";

const SHORTCUT_HOOK_ID = "sf2e-utils.insertSkillCheckShortcut";

type SkillCheckDialogResult = {
  skill: string;
  dc: number | null;
};

type ProseMirrorViewLike = {
  state: {
    selection: {
      from: number;
      to: number;
      empty: boolean;
    };
    doc: {
      textBetween(from: number, to: number, separator?: string): string;
    };
    tr: {
      insertText(text: string, from?: number, to?: number): unknown;
    };
  };
  dispatch(tr: unknown): void;
  focus(): void;
};

type ProseMirrorMenuLike = {
  view: ProseMirrorViewLike;
};

function strictInt(value: unknown): number | null {
  const text = String(value ?? "").trim();
  if (!/^[+-]?\d+$/.test(text)) return null;
  return Number.parseInt(text, 10);
}

function inferSkillFromSelection(
  selectedText: string,
  options: { slug: string; label: string }[],
): { slug: string; label: string } | null {
  const target = skillLabelToSlug(selectedText);
  if (!target) return null;
  return options.find((x) => x.slug === target) ?? null;
}

function getSelectedText(view: ProseMirrorViewLike): string {
  const { from, to, empty } = view.state.selection;
  if (empty) return "";
  return view.state.doc.textBetween(from, to, " ");
}

function insertTextAtSelection(view: ProseMirrorViewLike, text: string): void {
  const { from, to } = view.state.selection;
  const tr = view.state.tr.insertText(text, from, to);
  view.dispatch(tr);
  view.focus();
}

async function openSkillCheckDialog(menu: ProseMirrorMenuLike): Promise<void> {
  const options = getSkillOptions();
  if (!options.length) {
    ui.notifications.warn("No skills available to insert a check.");
    return;
  }

  let selectedText = getSelectedText(menu.view);
  const leftPadding = selectedText && selectedText[0] === " ";
  const rightPadding =
    selectedText && selectedText[selectedText.length - 1] === " ";
  selectedText = selectedText.trim();

  const inferredSkill = inferSkillFromSelection(selectedText, options)?.slug;
  const defaultSkill = inferredSkill ?? "flat";
  const defaultDc = getPartyDC();

  const optionHtml = options
    .map((option) => {
      const selected = option.slug === defaultSkill ? " selected" : "";
      return `<option value="${foundry.utils.escapeHTML(option.slug)}"${selected}>${foundry.utils.escapeHTML(option.label)}</option>`;
    })
    .join("");

  if (!foundry.applications.api.DialogV2) {
    throw new Error("DialogV2 API is unavailable.");
  }

  const result = (await foundry.applications.api.DialogV2.prompt({
    window: { title: "Insert Skill Check" },
    content: `
      <div class="form-group">
        <label>Skill</label>
        <select name="skill">${optionHtml}</select>
      </div>
      <div class="form-group">
        <label>DC</label>
        <input type="number" name="dc" min="0" step="1" value="${defaultDc}" />
      </div>
      <div class="form-group">
        <label>Quick Adjust</label>
        <div class="form-fields" style="gap: 0.25rem; flex-wrap: wrap;">
          <button type="button" data-dc-adjust="-5">-5</button>
          <button type="button" data-dc-adjust="-2">-2</button>
          <button type="button" data-dc-adjust="-1">-1</button>
          <button type="button" data-dc-adjust="1">+1</button>
          <button type="button" data-dc-adjust="2">+2</button>
          <button type="button" data-dc-adjust="5">+5</button>
        </div>
      </div>
    `,
    render: (_event: Event, dialog: { element?: HTMLElement | null }) => {
      const root = dialog.element;
      if (!root) return;
      const dcInput = root?.querySelector('input[name="dc"]');
      if (!(dcInput instanceof HTMLInputElement)) return;

      const adjustButtons = root.querySelectorAll("button[data-dc-adjust]");
      for (const button of Array.from(adjustButtons)) {
        button.addEventListener("click", () => {
          const delta = strictInt(
            (button as HTMLButtonElement).dataset.dcAdjust,
          );
          if (delta === null) return;

          const current = strictInt(dcInput.value) ?? 0;
          dcInput.value = String(Math.max(0, current + delta));
          dcInput.dispatchEvent(new Event("change", { bubbles: true }));
          dcInput.focus();
          dcInput.select();
        });
      }
    },
    ok: {
      label: "Insert",
      callback: (_event: Event, button: unknown): SkillCheckDialogResult => {
        const form = (button as { form?: HTMLFormElement }).form;
        const elements = form?.elements as
          | (HTMLFormControlsCollection & {
              skill?: HTMLSelectElement;
              dc?: HTMLInputElement;
            })
          | undefined;
        return {
          skill: String(elements?.skill?.value ?? "")
            .trim()
            .toLowerCase(),
          dc: strictInt(elements?.dc?.value),
        };
      },
    },
    rejectClose: false,
    modal: true,
  })) as SkillCheckDialogResult | null;

  if (!result) return;
  if (!result.skill || result.dc === null) {
    ui.notifications.warn("Please provide a valid skill and DC.");
    return;
  }

  insertTextAtSelection(
    menu.view,
    `${leftPadding ? " " : ""}@PCheck[skill:${result.skill},dc:${result.dc}]${rightPadding ? " " : ""}`,
  );
}

function isInsertSkillCheckShortcut(event: KeyboardEvent): boolean {
  if (!(event.ctrlKey || event.metaKey)) return false;
  return event.key?.toLowerCase() === "g";
}

const hooks = new HooksManager();
export function registerJournalEditorEnhancementsHooks(): void {
  hooks.on("getProseMirrorMenuItems", (menu, items) => {
    if (!game.user.isGM) return;

    const targetItems = items as Array<{
      action: string;
      title: string;
      icon: string;
      scope: string;
      cmd: () => boolean;
    }>;

    targetItems.push({
      action: "insertSkillCheck",
      title: "Insert Skill Check",
      icon: '<i class="fa-solid fa-dice-d20"></i>',
      scope: "text",
      cmd: () => {
        void openSkillCheckDialog(menu as ProseMirrorMenuLike);
        return true;
      },
    });
  });

  hooks.on("createProseMirrorEditor", (_uuid, plugins) => {
    if (!game.user.isGM) return;

    const pluginCtor = (
      globalThis as unknown as {
        ProseMirror?: { Plugin?: new (config: unknown) => unknown };
      }
    ).ProseMirror?.Plugin;

    if (!pluginCtor) return;

    (plugins as Record<string, unknown>)[SHORTCUT_HOOK_ID] = new pluginCtor({
      props: {
        handleKeyDown(
          view: ProseMirrorViewLike,
          event: KeyboardEvent,
        ): boolean {
          if (!isInsertSkillCheckShortcut(event)) return false;
          event.preventDefault();
          void openSkillCheckDialog({ view });
          return true;
        },
      },
    });
  });
}

export function unregisterJournalEditorEnhancementsHooks(): void {
  hooks.off();
}
