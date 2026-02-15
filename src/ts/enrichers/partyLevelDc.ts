import { getPartyDC } from "../helpers";

const PARTY_LEVEL_DC_PATTERN = /@PDC\[((?:\+|-)[\d]+)?\]/g;

function getAdjustmentFromArgs(args?: string): number {
  if (!args) return 0;
  const parsed = Number.parseInt(args, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

async function partyLevelDcEnricher(
  match: RegExpMatchArray,
): Promise<HTMLElement> {
  const value = getPartyDC() + getAdjustmentFromArgs(match[1]);
  const element = document.createElement("span");
  element.textContent = String(value);
  return element;
}

export function registerPartyLevelDcEnricher(): void {
  CONFIG.TextEditor.enrichers.push({
    pattern: PARTY_LEVEL_DC_PATTERN,
    enricher: partyLevelDcEnricher,
  });
}
