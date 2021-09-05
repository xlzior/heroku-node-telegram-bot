import { schedules, users } from "../../db";
import { groupPairs, withKeyboard, REMOVE_KEYBOARD } from "../../utils/telegram";
import { formatScheduleInfo, utcToLocal, localToUTC, validateTime, utcToLocal24 } from "../../utils/time";
import { HandlerArguments, DELETE_SELECT, DELETE_CONFIRM, DeleteSelectPartial, DeleteConfirmPartial } from "../../types/continueConversation";

export default function handleDelete({ bot, continueConversation }: HandlerArguments): void {
  bot.handle(/^\/delete_schedule/, async ({ send, chatId }) => {
    const tz = await users.timezone.get(chatId);
    if (!tz) return send("Use /set_timezone to get started.");

    const userSchedules = await schedules.getUser(chatId);
    userSchedules.sort((a, b) => utcToLocal24(a.time, tz) - utcToLocal24(b.time, tz));
    if (userSchedules.length === 0) {
      send("You don't have any scheduled journalling sessions yet! Use /add_schedule to add a new one instead.");
    } else if (userSchedules.length === 1) {
      const { time, questions } = userSchedules[0];
      const localTime = utcToLocal(time, tz);
      send(`Alright, you only have one schedule at ${formatScheduleInfo(localTime, questions)}\n\nAre you sure you would like to delete this scheduled journalling session? Please send 'Yes' to confirm.`);
      users.prevCommand.set(chatId, DELETE_CONFIRM, { time: localTime, tz });
    } else {
      const rawKeys = userSchedules.map(({ time }) => ({ text: utcToLocal(time, tz) }));
      const keyboard = groupPairs(rawKeys);
      send("Which schedule would you like to delete?", withKeyboard(keyboard));
      users.prevCommand.set(chatId, DELETE_SELECT, { tz });
    }
  });

  continueConversation[DELETE_SELECT] = async ({ send, chatId }, msg, partial) => {
    const { tz } = partial as DeleteSelectPartial;
    const time = validateTime(msg.text);
    if (!time) return send("Please send a valid time using the keyboard provided");

    const questions = await schedules.getQuestions(chatId, localToUTC(time, tz));
    if (questions.length > 0) {
      send(`You have chosen to delete the schedule at ${formatScheduleInfo(time, questions)}\n\nAre you sure you would like to delete this session? Please send 'Yes' to confirm.`, REMOVE_KEYBOARD);
      users.prevCommand.set(chatId, DELETE_CONFIRM, { time, tz });
    } else {
      send(`You do not have a session at ${time}. Please send a valid time using the keyboard provided.`);
    }
  };

  continueConversation[DELETE_CONFIRM] = async ({ send, chatId }, msg, partial) => {
    const { time, tz } = partial as DeleteConfirmPartial;
    if (msg.text === "Yes") {
      send("You have deleted your session.");
      schedules.delete(chatId, localToUTC(time, tz));
    } else {
      send("Deleting cancelled.");
    }
    users.prevCommand.reset(chatId);
  };
}
