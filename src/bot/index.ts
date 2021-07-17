import { Message } from "node-telegram-bot-api";

import { users, reflections } from "../db";
import { Shortcuts } from "../types/continueConversation";

import Bot from "./TelegramBot";
import handleBasic from "./basic";
import handleBrowse from "./browse";
import handleReflections from "./reflections";
import handleIDAT from "./idat";
import handleStats from "./stats";
import handleSchedules from "./schedules";
import handleBedtime from "./bedtime";
import handleQuests from "./quests";

const token = process.env.TOKEN;

let bot;
if (process.env.NODE_ENV === "production") {
  bot = new Bot(token);
  bot.setWebHook(process.env.HEROKU_URL + bot.token);
} else {
  bot = new Bot(token, { polling: true });
}

console.info(`Bot server started in ${process.env.NODE_ENV} mode`);

/* BOT RESPONSES */

const continueConversation = {};

handleBasic({ bot, continueConversation });
handleReflections({ bot, continueConversation });
handleIDAT({ bot, continueConversation });
handleBrowse({ bot, continueConversation });
handleStats({ bot, continueConversation });
handleSchedules({ bot, continueConversation });
handleBedtime({ bot, continueConversation });
handleQuests({ bot, continueConversation });

bot.onMessage(async (shortcuts: Shortcuts, msg: Message) => {
  const { chatId } = shortcuts;

  // continueConversation
  if (msg.text && !msg.text.startsWith("/")) {
    const { command, partial } = await users.prevCommand.get(chatId);
    if (continueConversation[command]) {
      continueConversation[command](shortcuts, msg, partial);
    }
  }

  // keep track of convoLength
  const reflectionId = await reflections.current.getId(chatId);
  if (reflectionId) reflections.incrementLength(chatId, reflectionId);
});

bot.on("polling_error", err => console.error(err));

module.exports = bot;
