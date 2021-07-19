import { users, reflections } from "../db";
import { USER_ALREADY_EXISTS } from "../db/errors";
import { clean, MARKDOWN, REMOVE_KEYBOARD } from "../utils/telegram";
import { formatStats } from "../utils/levels";
import { HandlerArguments, OPEN_REFLECTION } from "../types/continueConversation";

import helpMessage from "./help";

export default function handleBasic({ bot }: HandlerArguments): void {
  bot.handle(/\/start(@lifexp_bot)?$/, async ({ send, chatId }, msg) => {
    await send(`Hello, ${msg.from.first_name}!`);

    const message = [
      "Welcome to LifeXP, a gamified journalling chatbot.\n",
      "I'm here to help you pen down your thoughts in a safe and convenient environment.\n",
      "Use /open to start a new journal entry.",
      "If you need a prompt to start off, let me know using /prompt.",
      "If you did something that you're proud of and want to celebrate it, try /ididathing.",
      "Finally, /close the journal entry and let your mind rest.\n",
      "I hope you have a meaningful journalling session.",
    ].join("\n");
    await send(message);

    try {
      await users.create(chatId);
      const messageId = await bot.sendAndPin(chatId, formatStats(1, 0, 0));
      users.pinnedMessageId.set(chatId, messageId);
    } catch (error) {
      if (error !== USER_ALREADY_EXISTS) {
        console.error("error:", error);
      }
    }
  });

  bot.handle(/\/help/, ({ send }) => {
    send(clean(helpMessage.join("\n\n")), MARKDOWN);
  });

  bot.handle(/\/cancel/, async ({ send, chatId }) => {
    const { command } = await users.prevCommand.get(chatId);
    if (command) {
      send(`The command '${command}' has been cancelled.`, REMOVE_KEYBOARD);
      if (command === OPEN_REFLECTION) reflections.cancel(chatId);
      await users.prevCommand.reset(chatId);
    } else {
      send("There was no previous command.", REMOVE_KEYBOARD);
    }
  });
}
