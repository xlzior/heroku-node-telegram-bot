const Bot = require("./TelegramBot");

const db = require("../db");

const handleBasic = require("./basic");
const handleBrowse = require("./browse");
const handleReflections = require("./reflections");
const handleIDAT = require("./idat");
const handleStats = require("./stats");
const handleSchedules = require("./schedules");
const handleBedtime = require("./bedtime");
const handleQuests = require("./quests");

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
