import { schedules, users } from "../../db";
import { validateTime, formatScheduleInfo, localToUTC } from "../../utils/time";
import { HandlerArguments, ADD_TIME, ADD_QUESTIONS, AddTimePartial, AddQuestionsPartial } from "../../types/continueConversation";

export default function handleAdd({ bot, continueConversation }: HandlerArguments): void {
  bot.onText(/\/add_schedule/, async ({ send, chatId }) => {
    const tz = await users.timezone.get(chatId);
    if (!tz) return send("Use /set_timezone to get started.");

    send("Nice, let's create a new scheduled journalling session! What time would you like to have this session every day? Please send a time in 12-hour format (e.g. 9pm).");
    users.prevCommand.set(chatId, ADD_TIME, { tz });
  });

  continueConversation[ADD_TIME] = async ({ send, chatId }, msg, partial) => {
    const { tz } = partial as AddTimePartial;
    const time = validateTime(msg.text);
    if (!time) return send("Please send a valid time in 12-hour format (e.g. 9pm)");

    const questions = await schedules.getQuestions(chatId, localToUTC(time, tz));
    if (questions.length > 0) {
      send(`You already have a session set for ${formatScheduleInfo(time, questions)}\n\nPlease use /edit_schedule instead.`);
      users.prevCommand.reset(chatId);
    } else {
      send("What question prompts would you like to use in this session? You may have more than one prompt, just be sure to separate them with a line break.");
      users.prevCommand.set(chatId, ADD_QUESTIONS, { time, tz });
    }
  };

  continueConversation[ADD_QUESTIONS] = async ({ send, chatId }, msg, partial) => {
    const { time, tz } = partial as AddQuestionsPartial;
    const questions = msg.text.split("\n").filter(Boolean);
    send(`Okay, I'm creating a new session at ${formatScheduleInfo(time, questions)}`);
    schedules.add(chatId, localToUTC(time, tz), questions);
    users.prevCommand.reset(chatId);
  };
}

