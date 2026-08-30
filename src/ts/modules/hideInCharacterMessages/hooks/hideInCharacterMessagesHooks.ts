import type { ChatMessagePF2e } from "foundry-pf2e";
import { HooksManager } from "../../../helpers/hooks";

const hooks = new HooksManager();

export function registerHideInCharacterMessagesHooks(): void {
  hooks.on(
    "preCreateChatMessage",
    (message: ChatMessagePF2e, _, options: Record<string, unknown>) => {
      if (message.isRoll || message.item) {
        message.updateSource({ style: CONST.CHAT_MESSAGE_STYLES.OTHER });
        options.chatBubble = false;
      }
    },
  );
}

export function unregisterHideInCharacterMessagesHooks(): void {
  hooks.off();
}
