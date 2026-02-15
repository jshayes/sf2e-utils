const MACRO_RUNNER_PATTERN =
  /@RunMacro\[(?:"([^"]*)"|(\S+))\s*(.*?)\](?:{([^}]+)})?/gi;
const CLICK_SELECTOR = "a.inline-macro-execution";

let clickHandlerRegistered = false;

function parseArgs(argsString: string): Record<string, string> {
  const argsPattern = /(\w+)=\s*(?:"([^"]*)"|(\S+))/g;
  const args: Record<string, string> = {};
  let match: RegExpExecArray | null = null;

  while ((match = argsPattern.exec(argsString)) !== null) {
    const key = match[1];
    const value = match[2] ?? match[3] ?? "";
    args[key] = value;
  }

  return args;
}

function buildMacroExecutionButton(
  macro: foundry.documents.Macro,
  argsString: string,
  title: string,
  flavour?: string,
): HTMLElement {
  const link = document.createElement("a");
  link.classList.add("inline-macro-execution", "inline-check");
  link.dataset.macroUuid = macro.uuid ?? undefined;
  link.dataset.args = argsString;
  link.innerHTML = `<i class="fas fa-dice-d20"></i> ${flavour ?? title}`;
  return link;
}

async function getMacroFromUuid(
  id: string,
): Promise<foundry.documents.Macro | null> {
  const document = await fromUuid(id);
  if (document instanceof foundry.documents.Macro) {
    return document;
  }
  return null;
}

async function runMacroEnricher(
  match: RegExpMatchArray,
): Promise<HTMLElement | null> {
  try {
    const macroName = String(match[1] ?? "").trim();
    const macroId = String(match[2] ?? "").trim();
    const argsString = String(match[3] ?? "").trim();
    const flavour = match[4];

    if (!macroName && !macroId) return null;

    const macro = macroId
      ? await getMacroFromUuid(macroId)
      : game.macros.getName(macroName);
    if (!macro) return null;

    const title = `${macro.name}(${argsString})`;

    return buildMacroExecutionButton(macro, argsString, title, flavour);
  } catch (error) {
    console.error(error);
    return null;
  }
}

async function onClick(event: MouseEvent): Promise<void> {
  const target = event.target as HTMLElement | null;
  const link = target?.closest(CLICK_SELECTOR);
  if (!(link instanceof HTMLAnchorElement)) return;

  event.preventDefault();

  try {
    const argsString = String(link.dataset.args ?? "");
    const args = parseArgs(argsString);
    const macroId = String(link.dataset.macroUuid ?? "").trim();
    const macro = await getMacroFromUuid(macroId);
    if (!macro) {
      ui.notifications.warn(`Macro not found: ${macroId}`);
      return;
    }

    await macro.execute(args);
  } catch (error) {
    ui.notifications.error((error as Error).message);
    throw error;
  }
}

export function registerRunMacroEnricher(): void {
  CONFIG.TextEditor.enrichers.push({
    pattern: MACRO_RUNNER_PATTERN,
    enricher: runMacroEnricher,
  });

  if (!clickHandlerRegistered) {
    document.body.addEventListener("click", (event) => {
      void onClick(event as MouseEvent);
    });
    clickHandlerRegistered = true;
  }
}
