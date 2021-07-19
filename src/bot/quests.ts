import { quests, users, reflections, hashtags } from "../db";
import { clean, MARKDOWN } from "../utils/telegram";
import { generateQuestsList } from "../utils/pagination";
import { HandlerArguments, QuestPartial } from "../types/continueConversation";

const QUESTS = "quests";
const QUEST_HASHTAG = "#lifexp_quest";

export default function handleQuests({ bot }: HandlerArguments): void {
  bot.handle(/\/quests/, async ({ send, chatId }) => {
    const { error = false, message, options } = await generateQuestsList(chatId, 1);
    if (!error) await send("LifeXP quests provide you with a series of question prompts around a theme. Here are some quests for you to try, depending on what you wish to reflect on.");
    await send(message, options);
  });

  bot.on("callback_query", async ({ id, message: msg, data }) => {
    const [type, pageNumber] = data.split(" - ");

    if (type === QUESTS) {
      if (pageNumber === "current") return;

      const { message, options } = await generateQuestsList(msg.chat.id, parseInt(pageNumber));
      bot.editMessageText(message, {
        ...options,
        chat_id: msg.chat.id,
        message_id: msg.message_id,
      });
      bot.answerCallbackQuery(id);
    }
  });

  bot.handle(/\/preview_quest_(\d+)/, async ({ send }, msg, match ) => {
    const quest = await quests.get(parseInt(match[1]));
    if (!quest) return send("Quest not found.");

    const message = [
      `*${quest.name}*`,
      `${quest.questions.map((question, index) => `${index+1}. ${question}`).join("\n")}\n`,
      `▶️ /start_quest_${match[1]}`,
    ].join("\n");
    send(clean(message), MARKDOWN);
  });

  bot.handle(/\/start_quest_(\d+)/, async ({ send, chatId }, msg, match) => {
    const isOpen = await reflections.isOpen(chatId);
    if (isOpen) return send("You already have a reflection open. Please /close the reflection before starting the quest.");

    const quest = await quests.get(parseInt(match[1]));
    if (!quest) return send("Quest not found.");

    await bot.sendMessage(chatId, `You've started the quest "${quest.name}"! Here's your first prompt:`);

    const message = `*${quest.questions[0]}*\n\n✅ /done with prompt`;
    const botMsg = await bot.sendMessage(chatId, clean(message) , MARKDOWN);
    await reflections.open(chatId, botMsg.message_id);
    await hashtags.add(chatId, [QUEST_HASHTAG]);
    await users.prevCommand.set(chatId, QUESTS, { index: 1, questId: match[1] });
  });

  bot.handle(/\/done/, async (shortcuts, msg) => {
    const { chatId, send } = shortcuts;
    const { command, partial } = await users.prevCommand.get(chatId);

    if (command !== QUESTS) return;

    const { questId, index } = partial as QuestPartial;
    const { name, questions } = await quests.get(questId);

    if (index < questions.length) {
      send(clean(`*${questions[index]}*\n\n✅ /done`), MARKDOWN);
      users.prevCommand.set(chatId, QUESTS, { questId, index: index + 1 });
    } else {
      const botMsg = await send(`You've completed the quest "${name}". Good job!`);
      await bot.sendClosingStats(shortcuts, botMsg.message_id, name, msg.date);
      await users.prevCommand.reset(chatId);
    }
  });
}
