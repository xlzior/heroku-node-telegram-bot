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
  const helpMessage = [
    "Welcome to LifeXP, a gamified journaling chatbot.\n",
    "I'm here to help you pen down your thoughts in a safe and convenient environment.\n",
    "Use /open to start a new journal entry.",
    "If you need a prompt to start off, let me know using /prompt.",
    "If you did something that you're proud of and want to celebrate it, try /ididathing.",
    "Finally, /close the journal entry and let your mind rest.\n",
    "I hope you have a meaningful journaling session."
  ].join("\n");
  bot.sendMessage(msg.chat.id, helpMessage)
})

bot.onText(/\/tour/, msg => {
  // TODO: tour to go through all features?
})

bot.onText(/\/open/, msg => {
  openReflection(msg.from.id, msg.message_id)
  .then(() => {
    bot.sendMessage(msg.chat.id, "Let's start a journaling session! If you need a prompt, you can use /prompt. If not, just start typing and I'll be here when you need me.")
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
        const firstLine = `#${hashtag}: ${messages.length}`
        const nextLines = messages
          .map(({ messageId, name }) => `/goto${messageId} ${name}`)
          .join('\n')
        return `${firstLine}\n${nextLines}`;
      })
      .join('\n\n');
    bot.sendMessage(msg.chat.id, message);
  });
});

bot.onText(/\/goto(\d+)/, (msg, match) => {
  bot.sendMessage(msg.chat.id, "The conversation started here!", {
    reply_to_message_id: match[1]
  })
})

bot.onText(/\/emojis/, msg => {

})

// Messages with no command

bot.on('message', msg => {
  const userId = msg.from.id;

  // TODO: automatically open a conversation for a smoother journaling experience?

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
