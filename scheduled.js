require("dotenv").config();
const Bot = require('node-telegram-bot-api');

const { fn, server } = require('./web');

const token = process.env.TOKEN;

let bot;
if(process.env.NODE_ENV === 'production') {
  bot = new Bot(token);
  bot.setWebHook(process.env.HEROKU_URL + bot.token);
} else {
  bot = new Bot(token, { polling: true });
}

console.info(`Bot server started in ${process.env.NODE_ENV} mode`);

/* MAIN */

const main = async () => {
  // do whatever

  server.close(process.exit);
}

main();

fn(bot);