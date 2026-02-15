import {
  getPartyDC,
  getSkillOptions,
  skillLabelToSlug,
  type SkillOption,
} from "../helpers";

type MacroScopeInput = {
  skill?: unknown;
  dc?: unknown;
};

type MacroScope = {
  skill?: string;
  dc?: number | string;
};

type MacroResult = {
  skill: string;
  dc: number | null;
};

function parseDc(value?: number | string): number | null {
  const parsed = Number.parseInt(String(value ?? "").trim(), 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function error(error: string) {
  ui.notifications.error(error);
  throw new Error(error);
}

function parseSkill(
  skill: string,
  skills: SkillOption[],
): SkillOption | undefined {
  const slug = skillLabelToSlug(skill);
  return skills.find((x) => x.slug === slug);
}

function validateScope(scope?: MacroScopeInput): asserts scope is MacroScope {
  if (scope?.skill && typeof scope.skill !== "string") {
    error(`skill must be a string, received ${typeof scope.skill}`);
  }

  if (scope?.dc && !["string", "number"].includes(typeof scope.dc)) {
    error(`dc must be a string or number, received ${typeof scope.dc}`);
  }
}

function parseDefaults(
  skills: SkillOption[],
  scope?: MacroScopeInput,
): { skill: SkillOption; dc: number | null } {
  validateScope(scope);

  const fallbackSkill = skills.find((x) => x.slug === "flat") ?? skills[0];
  if (!fallbackSkill) {
    throw new Error("No skill options were returned by module API.");
  }

  return {
    skill:
      parseSkill(scope.skill ?? fallbackSkill.slug, skills) ?? fallbackSkill,
    dc: parseDc(scope.dc ?? getPartyDC()),
  };
}

export async function createSkillCheckMessage(
  explicitScope?: MacroScope,
): Promise<void> {
  const skills = getSkillOptions();
  if (!skills.length) {
    ui.notifications.warn("No skill options available.");
    return;
  }

  const defaults = parseDefaults(skills, explicitScope);
  const optionHtml = skills
    .map((skill) => {
      const selected = skill.slug === defaults.skill.slug ? " selected" : "";
      return `<option value="${foundry.utils.escapeHTML(skill.slug)}"${selected}>${foundry.utils.escapeHTML(skill.label)}</option>`;
    })
    .join("");

  if (!foundry.applications.api.DialogV2) {
    throw new Error("DialogV2 API is unavailable.");
  }

  const result = (await foundry.applications.api.DialogV2.prompt({
    window: { title: "Create Skill Check" },
    content: `
    <div class="form-group">
      <label>Skill</label>
      <select name="skill">${optionHtml}</select>
    </div>
    <div class="form-group">
      <label>DC</label>
      <input type="number" name="dc" min="0" step="1" value="${defaults.dc ?? ""}" />
    </div>
  `,
    ok: {
      label: "Confirm",
      callback: (_event: Event, button: unknown): MacroResult => {
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
          dc: parseDc(elements?.dc?.value),
        };
      },
    },
    rejectClose: false,
    modal: true,
  })) as MacroResult | null;

  if (!result) return;
  if (!result.skill) {
    ui.notifications.warn("Please select a skill.");
    return;
  }
  if (result.dc === null) {
    ui.notifications.warn("Please enter a valid DC.");
    return;
  }

  const vowels = ["a", "e", "i", "o", "u"];
  const saves = ["fortitude", "reflex", "will"];
  const article = vowels.includes(result.skill[0] ?? "") ? "an" : "a";
  const suffix = saves.includes(result.skill) ? "save." : "check.";
  const content = `Make ${article} @Check[${result.skill}|dc:${result.dc}] ${suffix}`;

  await ChatMessage.create({ content });
}
