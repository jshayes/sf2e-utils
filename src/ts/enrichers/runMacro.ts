const MACRO_RUNNER_PATTERN =
  /@RunMacro\[(?:"([^"]*)")\s*(.*?)\](?:{([^}]+)})?/gi;
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
  macroName: string,
  argsString: string,
  title: string,
  flavor?: string,
): HTMLElement {
  const link = document.createElement("a");
  link.classList.add("inline-macro-execution", "inline-check");
  link.dataset.macroName = macroName;
  link.dataset.args = argsString;
  link.innerHTML = `<i class="fas fa-dice-d20"></i> ${flavor ?? title}`;
  return link;
}

async function runMacroEnricher(
  match: RegExpMatchArray,
): Promise<HTMLElement | null> {
  try {
    const macroName = String(match[1] ?? "").trim();
    const argsString = String(match[2] ?? "").trim();
    const flavor = match[3];

    if (!macroName) return null;

    const macro = game.macros.getName(macroName);
    const title = `${macro?.name ?? macroName}(${argsString})`;

    return buildMacroExecutionButton(macroName, argsString, title, flavor);
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
    const macroName = String(link.dataset.macroName ?? "").trim();
    const argsString = String(link.dataset.args ?? "");
    const args = parseArgs(argsString);
    const macro = game.macros.getName(macroName);
    if (!macro) {
      ui.notifications.warn(`Macro not found: ${macroName}`);
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
