import { ActorPF2e } from "foundry-pf2e";
import { moduleId } from "../../../constants";
import { HooksManager } from "../../../helpers/hooks";

const FLAG_SCOPE = "deadStyle";
const DEAD_ALPHA = 0.25;
const DEAD_SORT = -1;

type DeadStyleState = {
  alpha?: number;
  sort?: number;
};

function getStoredDeadStyle(tokenDoc: TokenDocument): DeadStyleState | null {
  return tokenDoc.getFlag(moduleId, FLAG_SCOPE) as DeadStyleState | null;
}

async function applyDeadStyle(tokenDoc: TokenDocument): Promise<void> {
  const deadStyle = getStoredDeadStyle(tokenDoc);
  if (!deadStyle) {
    await tokenDoc.setFlag(moduleId, FLAG_SCOPE, {
      alpha: tokenDoc.alpha,
      sort: tokenDoc.sort ?? 0,
    });
  }

  const updates: Partial<TokenDocument["_source"]> = {};
  if (tokenDoc.alpha !== DEAD_ALPHA) updates.alpha = DEAD_ALPHA;
  if ((tokenDoc.sort ?? 0) !== DEAD_SORT) updates.sort = DEAD_SORT;

  if (Object.keys(updates).length) {
    await tokenDoc.update(updates);
  }
}

async function clearDeadStyle(tokenDoc: TokenDocument): Promise<void> {
  const deadStyle = getStoredDeadStyle(tokenDoc);
  if (!deadStyle) return;

  const updates: Partial<TokenDocument["_source"]> = {};
  if (deadStyle.alpha !== undefined && deadStyle.alpha !== null) {
    updates.alpha = deadStyle.alpha;
  }
  if (deadStyle.sort !== undefined && deadStyle.sort !== null) {
    updates.sort = deadStyle.sort;
  }

  if (Object.keys(updates).length) {
    await tokenDoc.update(updates);
  }

  await tokenDoc.unsetFlag(moduleId, FLAG_SCOPE);
}

function actorIsDead(actor: ActorPF2e): boolean {
  const hp = actor.system.attributes.hp;
  if (!hp) return false;

  const value = Number(hp.value ?? 0);
  const max = Number(hp.max ?? 0);

  return max > 0 && value <= 0;
}

function actorDeathStateChanged(
  changed: DeepPartial<ActorPF2e["_source"]>,
): boolean {
  return (
    foundry.utils.getProperty(changed, "system.attributes.hp.value") !==
      undefined ||
    foundry.utils.getProperty(changed, "system.attributes.hp.max") !==
      undefined ||
    foundry.utils.getProperty(changed, "statuses") !== undefined
  );
}

const hooks = new HooksManager();
export function registerHideDeadHooks(): void {
  hooks.on("updateActor", async (actor: ActorPF2e, changed) => {
    if (!game.user.isGM) return;
    if (!actorDeathStateChanged(changed)) return;
    if (actor.hasPlayerOwner) return;

    const tokenDocs = canvas.scene?.tokens.filter(
      (tokenDoc) => tokenDoc.actor?.id === actor.id,
    );
    if (!tokenDocs?.length) return;

    for (const tokenDoc of tokenDocs) {
      if (actorIsDead(actor)) {
        await applyDeadStyle(tokenDoc);
      } else {
        await clearDeadStyle(tokenDoc);
      }
    }
  });
}

export function unregisterHideDeadHooks(): void {
  hooks.off();
}
