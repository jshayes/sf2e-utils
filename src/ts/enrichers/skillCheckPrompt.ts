import { getSkillOptions, type SkillOption } from "../helpers";
import { createSkillCheckMessage } from "../macros";

const SKILL_CHECK_PROMPT_PATTERN = /@(PCheck)\[([^\]]+)?\](?:{([^}]+)})?/g;
const CLICK_SELECTOR = "a.pcheck";

let clickHandlerRegistered = false;

type ParsedArgs = {
  dc?: number;
  skill?: SkillOption;
};

function parseIcon(skill?: string): string {
  switch (skill) {
    case "perception":
      return "fa-eye";
    case "reflex":
      return "fa-person-running";
    case "will":
      return "fa-brain";
    case "fortitude":
      return "fa-heart-pulse";
    default:
      return "fa-dice-d20";
  }
}

function parseArgs(input: string, skills: SkillOption[]): ParsedArgs {
  const entries = input.split(",").map((rawEntry) => {
    const [rawKey, rawValue] = rawEntry.split(":", 2);
    const key = String(rawKey ?? "").trim();
    const value = String(rawValue ?? "").trim();

    switch (key) {
      case "dc": {
        if (!/^[+-]?\d+$/.test(value)) {
          throw new Error(`${value} is not a valid integer`);
        }
        return [key, Number.parseInt(value, 10)] as const;
      }
      case "skill": {
        const skill = skills.find((x) => x.slug === value);
        if (!skill) {
          throw new Error(`Unknown skill: ${value}`);
        }
        return [key, skill] as const;
      }
      default:
        throw new Error(`Unknown argument: ${key}`);
    }
  });

  return Object.fromEntries(entries);
}

function buildMacroExecutionButton(
  args: ParsedArgs,
  flavour?: string,
): HTMLElement {
  const argsString = JSON.stringify({ dc: args.dc, skill: args.skill?.slug });
  const title =
    `${args.dc ? `DC ${args.dc} ` : ""}${args.skill?.label ?? ""}`.trim();
  const icon = parseIcon(args.skill?.slug);

  const link = document.createElement("a");
  link.classList.add("pcheck", "inline-check");
  link.dataset.args = argsString;
  link.innerHTML = `<i class="fa-solid ${icon} icon"></i> ${flavour ?? title}`;
  return link;
}

async function skillCheckPromptEnricher(
  match: RegExpMatchArray,
): Promise<HTMLElement | null> {
  const argsInput = match[2];
  const flavour = match[3];
  const skills = getSkillOptions();

  try {
    const parsedArgs = argsInput
      ? parseArgs(argsInput, skills)
      : { skill: skills.find((x) => x.slug === "flat") };
    return buildMacroExecutionButton(parsedArgs, flavour);
  } catch (error) {
    ui.notifications.warn((error as Error).message);
    return null;
  }
}

async function onClick(event: MouseEvent): Promise<void> {
  const target = event.target as HTMLElement | null;
  const link = target?.closest(CLICK_SELECTOR);
  if (!(link instanceof HTMLAnchorElement)) return;

  event.preventDefault();

  try {
    const argsString = String(link.dataset.args ?? "{}");
    const args = JSON.parse(argsString) as { dc?: number; skill?: string };

    await createSkillCheckMessage(args);
  } catch (error) {
    ui.notifications.error((error as Error).message);
    throw error;
  }
}

export function registerSkillCheckPromptEnricher(): void {
  CONFIG.TextEditor.enrichers.push({
    pattern: SKILL_CHECK_PROMPT_PATTERN,
    enricher: skillCheckPromptEnricher,
  });

  if (!clickHandlerRegistered) {
    document.body.addEventListener("click", (event) => {
      void onClick(event as MouseEvent);
    });
    clickHandlerRegistered = true;
  }
}
