const levelLookup: number[] = [
  14, 15, 16, 18, 19, 20, 22, 23, 24, 26, 27, 28, 30, 31, 32, 34, 35, 36, 38,
  39, 40, 42, 44, 46, 48, 50,
];

type PartyMember = {
  system?: {
    details?: {
      level?: {
        value?: number;
      };
    };
  };
};

export function getPartyDC(): number {
  const members = (
    game.actors as unknown as {
      party?: {
        members?: PartyMember[];
      };
    }
  ).party?.members;

  if (!members?.length) {
    return levelLookup[0];
  }

  const highestLevel = Math.max(
    ...members.map((member) => member.system?.details?.level?.value ?? 0),
  );

  const safeIndex = Math.max(0, Math.min(highestLevel, levelLookup.length - 1));
  return levelLookup[safeIndex];
}
