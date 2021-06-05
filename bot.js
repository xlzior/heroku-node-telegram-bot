const Bot = require('node-telegram-bot-api');

const {
  createUser,
  updatePrevCommand, resetPrevCommand, getPrevCommand,
  openReflection, closeReflection,
  addHashtags, getHashtags,
  addEmojis
} = require('./db');
const { getRandomPrompt, countEmojis } = require('./utils');

const token = process.env.TOKEN;

let bot;
if(process.env.NODE_ENV === 'production') {
  bot = new Bot(token);
  bot.setWebHook(process.env.HEROKU_URL + bot.token);
} else {
  bot = new Bot(token, { polling: true });
}

console.log('Bot server started in ' + process.env.NODE_ENV + ' mode');

/* BOT RESPONSES */

bot.onText(/\/prompt/, msg => {
  bot.sendMessage(msg.chat.id, getRandomPrompt());
});

bot.onText(/\/echo (.+)/, (msg, match) => {
  bot.sendMessage(msg.chat.id, match[1]);
});

bot.onText(/\/start/, msg => {
  bot.sendMessage(msg.chat.id, `Hello, ${msg.from.first_name}! Welcome to LifeXP, a gamified journaling chatbot.`)

  createUser(msg.from.id);
})

bot.onText(/\/help/, msg => {
  bot.sendMessage(msg.chat.id, "/open to start a new journal entry")
  // TODO: write help message
})

bot.onText(/\/tour/, msg => {
  // TODO: tour to go through all features?
})

bot.onText(/\/open/, msg => {
  openReflection(msg.from.id, msg.message_id)
  .then(() => {
    bot.sendMessage(msg.chat.id, "Let's start a journalling session! If you need a prompt, you can use /prompt. If not, just start typing and I'll be here when you need me.")
  })
  .catch(error => {
    bot.sendMessage(msg.chat.id, error);
  });
})

bot.onText(/\/close/, msg => {
  bot.sendMessage(msg.chat.id, "Whew! Nice journaling session. How would you like to name this conversation for future browsing?")
  updatePrevCommand(msg.from.id, { command: "close" })
  // TODO: force user to reply
})

bot.onText(/\/hashtags/, msg => {
  getHashtags(msg.from.id)
  .then(hashtags => {
    const message = hashtags
      .map(({ hashtag, messages }) => {
        return `#${hashtag}: ${messages.length}\n${messages.map(
          ({ messageId, name }) => `/goto${messageId} ${name}`).join('\n')}`
      })
      .join('\n\n');
    bot.sendMessage(msg.from.id, message);
  });
});

bot.onText(/\/goto(\d+)/, (msg, match) => {
  bot.sendMessage(msg.from.id, "The conversation started here!", {
    reply_to_message_id: match[1]
  })
})

bot.onText(/\/emojis/, msg => {

})

bot.on('message', msg => {
  const userId = msg.from.id;

  // TODO: automatically open a conversation for a smoother journalling experience?

  if (msg.entities) {
    const hashtags = msg.entities
      .filter(({ type }) => type === 'hashtag')
      .map(({ offset, length }) => msg.text.substr(offset, length));
    addHashtags(userId, hashtags);
  }

  addEmojis(userId, countEmojis(msg.text));

  getPrevCommand(userId)
  .then(prevCommand => {
    switch (prevCommand.command) {
      case 'close':
        closeReflection(msg.from.id, msg.message_id, msg.text)
        .then(() => {
          bot.sendMessage(msg.from.id, `Good job! You wrapped up the '${msg.text}' conversation. I'm proud of you!`)
          return resetPrevCommand(msg.from.id);
        })
        .catch(error => {
          bot.sendMessage(msg.chat.id, error);
        });
        break;
      default:
        console.log('Encountered unfamiliar command:', prevCommand)
    }
  })
  .catch(error => console.log(error));
});

bot.on("polling_error", (err) => console.log(err));

module.exports = bot;
