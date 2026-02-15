export type SkillOption = {
  slug: string;
  label: string;
};

type PartyMember = {
  system?: {
    skills?: Record<string, unknown>;
  };
};

export function getSkillOptions(): SkillOption[] {
  const members = (
    game.actors as unknown as {
      party?: {
        members?: PartyMember[];
      };
    }
  ).party?.members;

  const skills = new Set<string>(
    (members ?? []).flatMap((member) => Object.keys(member.system?.skills ?? {})),
  );

  skills.add("flat");
  skills.add("fortitude");
  skills.add("perception");
  skills.add("reflex");
  skills.add("will");

  return Array.from(skills.values())
    .sort()
    .map((slug) => ({ slug, label: skillSlugToLabel(slug) }));
}

function upperCaseFirst(value: string): string {
  return (value[0] ?? "").toUpperCase() + value.slice(1);
}

export function skillSlugToLabel(skill: string): string {
  return skill.split("-").map(upperCaseFirst).join(" ");
}

export function skillLabelToSlug(skill: unknown): string {
  return String(skill ?? "")
    .split(" ")
    .map((x) => x.toLowerCase())
    .join("-");
}
