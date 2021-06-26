const Bot = require("./TelegramBot");

const db = require("../db");

const handleBasic = require("./basic");
const handleBrowse = require("./browse");
const handleReflections = require("./reflections");
const handleIDAT = require("./idat");
const handleStats = require("./stats");

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

bot.onMessage(async (shortcuts, msg) => {
  // console.log(msg.photo[2].file_id);

  if (msg.text && !msg.text.startsWith("/")) {
    const command = await db.users.prevCommand.get(shortcuts.userId);
    if (continueConversation[command]) {
      continueConversation[command](shortcuts, msg);
    } else if (command) {
      console.error("Encountered unfamiliar command:", command);
    }
  }
});

bot.on("polling_error", err => console.error(err));

module.exports = bot;
