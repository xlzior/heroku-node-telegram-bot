import { HandlerArguments } from "../types/continueConversation";
import { getResources } from "../utils";

const WAITING_TIME = 2500;

const SYNONYMS_LIST = {
  "anxious": ["anxious", "anxiety"],
  "angry": ["angry"],
  "stressed": ["stressed"],
  "sad": ["sad", "down"],
  "tired": ["tired"],
};

const SYNONYMS_MAP = {};

// convert list to map
Object.keys(SYNONYMS_LIST).forEach(key => {
  SYNONYMS_LIST[key].forEach((synonym: string) => {
    SYNONYMS_MAP[synonym] = key;
  });
});

const allCommands = Object.values(SYNONYMS_LIST).flat().join("|");

const resourceCommandRegex = new RegExp(`/(${allCommands})`);

export default function handleResources({ bot }: HandlerArguments): void {
  bot.handle(/\/resources/, async ({ send }) => {
    send(`Hey there! Here are some resources I've curated about dealing with various emotions that you may be experiencing. Click on the command(s) to find related resources:\n\n${Object.keys(SYNONYMS_LIST).map(text => `/${text}`).join("\n")}`);
  });

  bot.handle(resourceCommandRegex, async ({ send, chatId }, msg, match) => {
    const standardisedName = SYNONYMS_MAP[match[1]];
    const resources = getResources(standardisedName);

    await bot.sendChatAction(chatId, "typing");
    resources.forEach((text, index) => {
      setTimeout(async () => {
        await send(text);
        if (index < resources.length - 1) await bot.sendChatAction(chatId, "typing");
      }, (index + 1) * WAITING_TIME);
    });
  });
}
