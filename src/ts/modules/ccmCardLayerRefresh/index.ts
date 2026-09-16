import { HooksManager } from "../../helpers/hooks";

type CcmCardsDocument = Cards & {
  canvasCard?: unknown;
};

type CcmCardLayer = {
  draw: () => Promise<unknown>;
};

const ccmModuleId = "complete-card-management";
const redrawDelayMilliseconds = 5;
const hooks = new HooksManager();

let redrawTimer: number | undefined;
let redrawQueue = Promise.resolve();
let registration = 0;

function isCcmCardsDocument(document: unknown): document is CcmCardsDocument {
  if (!(document instanceof foundry.abstract.Document)) return false;

  return document.documentName === "Cards";
}

function getCcmCardLayer(): CcmCardLayer | undefined {
  return (canvas as typeof canvas & { cards?: CcmCardLayer }).cards;
}

function scheduleCardLayerRedraw(card: Card<Cards>): void {
  if (!game.modules.get(ccmModuleId)?.active) return;

  const stack = card.parent;
  if (
    !isCcmCardsDocument(stack) ||
    stack.type !== "pile" ||
    !stack.canvasCard
  ) {
    return;
  }

  if (redrawTimer !== undefined) window.clearTimeout(redrawTimer);

  const currentRegistration = registration;
  redrawTimer = window.setTimeout(() => {
    redrawTimer = undefined;

    redrawQueue = redrawQueue
      .then(async () => {
        if (currentRegistration !== registration || !canvas.ready) return;

        const cardLayer = getCcmCardLayer();

        if (cardLayer) await cardLayer.draw();
      })
      .catch((error: unknown) => {
        console.error(
          "SF2E Utils | Failed to redraw the CCM card layer",
          error,
        );
      });
  }, redrawDelayMilliseconds);
}

export function registerCcmCardLayerRefreshModule(): void {
  registration += 1;
  hooks.on("createCard", scheduleCardLayerRedraw);
  hooks.on("deleteCard", scheduleCardLayerRedraw);
}

export function unregisterCcmCardLayerRefreshModule(): void {
  registration += 1;
  hooks.off();

  if (redrawTimer !== undefined) window.clearTimeout(redrawTimer);
  redrawTimer = undefined;
}
