import { schedules, users, reflections } from "../../db";
import { clean, MARKDOWN } from "../../utils/telegram";
import { generateDateTime } from "../../utils/time";
import { HandlerArguments, ScheduledPartial } from "../../types/continueConversation";

const SCHEDULED = "scheduled";

export default function handleSession({ bot }: HandlerArguments): void {
  bot.handle(/^\/skip/, async ({ chatId, send }) => {
    const { command } = await users.prevCommand.get(chatId);
    if (command !== SCHEDULED) return;

    users.prevCommand.reset(chatId);
    reflections.cancel(chatId);
    send("Alright, skipping this session.");
  });

  bot.handle(/^\/done/, async (shortcuts, msg) => {
    const { chatId, send } = shortcuts;
    const { command, partial } = await users.prevCommand.get(chatId);
    if (command !== SCHEDULED) return;

    const { time, index } = partial as ScheduledPartial;
    const questions = await schedules.getQuestions(chatId, time);

    if (index < questions.length) {
      send(clean(`*${questions[index]}*\n\n✅ /done`), MARKDOWN);
      users.prevCommand.set(chatId, SCHEDULED, { time, index: index + 1 });
    } else {
      const botMsg = await send("You've completed your scheduled journalling session. Good job!");
      const tz = await users.timezone.get(chatId);
      await bot.sendClosingStats(shortcuts, botMsg.message_id, generateDateTime(tz), msg.date);
      await users.prevCommand.reset(chatId);
    }
  });
}
