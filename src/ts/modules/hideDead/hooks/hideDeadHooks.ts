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

const hooks = new HooksManager();
export function registerHideDeadHooks(): void {
  hooks.on("updateCombatant", async (combatant, changed) => {
    if (!game.user.isGM) return;
    if (changed.defeated === undefined) return;

    const tokenId = String(combatant.tokenId ?? "");
    const tokenDoc = combatant.token ?? canvas.scene?.tokens.get(tokenId);
    if (!tokenDoc) return;

    if (combatant.defeated) {
      await applyDeadStyle(tokenDoc);
    } else {
      await clearDeadStyle(tokenDoc);
    }
  });
}

export function unregisterHideDeadHooks(): void {
  hooks.off();
}
