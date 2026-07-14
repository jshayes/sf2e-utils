import { HooksManager } from "../../../helpers/hooks";
import type { ChatMessagePF2e } from "foundry-pf2e";

const hooks = new HooksManager();

function getMessageType(message: ChatMessagePF2e) {
  if (message.whisper.length === 0) {
    return "public";
  }

  if (message.blind) {
    return "blind";
  }

  return "private";
}

function shouldHidePrivateMessage(message: ChatMessagePF2e) {
  if (message.flags?.core?.initiativeRoll) {
    return true;
  }

  const context = message.flags?.sf2e?.context;
  if (!context || !("traits" in context)) {
    return false;
  }

  return context.traits.includes("secret");
}

function shouldHide(message: ChatMessagePF2e) {
  if (!message.author?.isGM) return false;
  console.log("wat", message);

  const messageType = getMessageType(message);

  switch (messageType) {
    case "public":
      return false;

    case "blind":
      return true;

    case "private":
      return shouldHidePrivateMessage(message);
  }
}

export function registerHideSecretRollsHooks(): void {
  hooks.on("preCreateChatMessage", (message) => {
    if (!shouldHide(message)) return;

    message.updateSource({
      sound: null,
    });
  });

  hooks.on("renderChatMessageHTML", (message, html) => {
    if (game.user.isGM) return;

    if (shouldHide(message)) {
      const element = html instanceof HTMLElement ? html : html[0];

      if (element) {
        element.style.display = "none";
      }
    }
  });
}

export function unregisterHideSecretRollsHooks() {
  hooks.off();
}
