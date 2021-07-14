import Bot = require("./TelegramBot");

import db = require("../db");

import handleBasic = require("./basic");
import handleBrowse = require("./browse");
import handleReflections = require("./reflections");
import handleIDAT = require("./idat");
import handleStats = require("./stats");
import handleSchedules = require("./schedules");
import handleBedtime = require("./bedtime");
import handleQuests = require("./quests");

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

handleBasic(bot, continueConversation);
handleReflections(bot, continueConversation);
handleIDAT(bot, continueConversation);
handleBrowse(bot, continueConversation);
handleStats(bot, continueConversation);
handleSchedules(bot, continueConversation);
handleBedtime(bot, continueConversation);
handleQuests(bot, continueConversation);

bot.onMessage(async (shortcuts, msg) => {
  const { chatId } = shortcuts;

  // continueConversation
  if (msg.text && !msg.text.startsWith("/")) {
    const { command, partial } = await db.users.prevCommand.get(chatId);
    if (continueConversation[command]) {
      continueConversation[command](shortcuts, msg, partial);
    }
  }

  // keep track of convoLength
  const reflectionId = await db.reflections.current.getId(chatId);
  if (reflectionId) db.reflections.incrementLength(chatId, reflectionId);
});

bot.on("polling_error", err => console.error(err));

module.exports = bot;
