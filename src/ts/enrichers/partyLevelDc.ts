import { getPartyDC } from "../helpers";
import { registerEnricher, unregisterEnricher } from "./utils";

const pattern = /@PDC\[((?:\+|-)[\d]+)?\]/g;

function getAdjustmentFromArgs(args?: string): number {
  if (!args) return 0;
  const parsed = Number.parseInt(args, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

async function enricher(match: RegExpMatchArray): Promise<HTMLElement> {
  const value = getPartyDC() + getAdjustmentFromArgs(match[1]);
  const element = document.createElement("span");
  element.textContent = String(value);
  return element;
}

const partyLevelDcEnricher = {
  pattern,
  enricher,
};

export function registerPartyLevelDcEnricher(): void {
  registerEnricher(partyLevelDcEnricher);
}

export function unregisterPartyLevelDcEnricher(): void {
  unregisterEnricher(pattern);
}
