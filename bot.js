const Bot = require('node-telegram-bot-api');

const {
  createUser,
  setPinnedMessageId, updateXP, getXP,
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

/* BOT UTILITIES */

const getLevel = xp => Math.floor(xp / 1000) + 1;

const formatLevel = xp => `Level ${getLevel(xp)} (${xp} XP)`;

const updateUserOnXPChange = (chatId, type, xpData) => {
  const [oldXP, changeInXP, newXP, pinnedMessageId] = xpData;
  bot.sendMessage(chatId, `You earned ${changeInXP} XP for ${type}!`);
  if (getLevel(newXP) > getLevel(oldXP)) {
    bot.sendMessage(chatId, `You levelled up! You are now level ${getLevel(newXP)}`);
  }
  bot.editMessageText(formatLevel(newXP), {
    chat_id: chatId,
    message_id: pinnedMessageId,
  })
}

/* BOT RESPONSES */

const continueConversation = {};

bot.onText(/\/prompt/, msg => {
  bot.sendMessage(msg.chat.id, getRandomPrompt());
});

bot.onText(/\/echo (.+)/, (msg, match) => {
  bot.sendMessage(msg.chat.id, match[1]);
});

const sendAndPin = (chatId, message) => {
  return bot.sendMessage(chatId, message)
  .then(botMsg => {
    bot.pinChatMessage(chatId, botMsg.message_id);
    return botMsg.message_id;
  })
}

bot.onText(/\/start/, msg => {
  const userId = msg.from.id;
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, `Hello, ${msg.from.first_name}! Welcome to LifeXP, a gamified journaling chatbot.`);

  createUser(userId)
  .then(() => sendAndPin(chatId, formatLevel(0)))
  .then(messageId => setPinnedMessageId(userId, messageId));
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

continueConversation["close"] = msg => {
  const userId = msg.from.id;
  closeReflection(userId, msg.message_id, msg.text)
  .then(convoLength => {
    bot.sendMessage(msg.chat.id, `Good job! You wrapped up the '${msg.text}' conversation. I'm proud of you!`)
    return updateXP(msg.from.id, convoLength);
  })
  .then(xpData => {
    updateUserOnXPChange(msg.chat.id, "this conversation", xpData);
    return resetPrevCommand(userId);
  })
  .catch(error => {
    bot.sendMessage(msg.chat.id, error);
  });
}

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

bot.onText(/\/lifexp/, msg => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  getXP(userId)
  .then(({ xp, pinnedMessageId }) => {
    bot.unpinChatMessage(chatId, pinnedMessageId);
    sendAndPin(chatId, formatLevel(xp))
    .then(messageId => setPinnedMessageId(userId, messageId));
  });
  // TODO: x more points to the next level
})

bot.onText(/\/ididathing/, msg => {
  bot.sendMessage(msg.chat.id, "Congrats! Whether it's a small win or a big win, let's celebrate it!");
  bot.sendMessage(msg.chat.id, "So tell me, what did you do?");
  updatePrevCommand(msg.from.id, { command: "ididathing - what" });
})

continueConversation["ididathing - what"] = msg => {
  bot.sendMessage(msg.chat.id, "Amazing! How do you feel about it now?");
  updatePrevCommand(msg.from.id, { command: "ididathing - feeling" });
}

continueConversation["ididathing - feeling"] = msg => {
  bot.sendMessage(msg.chat.id, "Nice~ On a scale of 1 to 10, how difficult would you rate it?");
  updatePrevCommand(msg.from.id, { command: "ididathing - difficulty" });
}

const DIFFICULTY_XP_MULTIPLIER = 100;

continueConversation["ididathing - difficulty"] = msg => {
  const send = message => bot.sendMessage(msg.chat.id, message);
  const match = msg.text.match(/\d+/);
  if (!match) return send("Please enter a valid number between 1 and 10 (inclusive)");

  const difficulty = parseInt(match[0]);
  if (difficulty < 1 || difficulty > 10) {
    send("Please enter a valid number between 1 and 10 (inclusive)");
  } else {
    if (difficulty <= 3) {
      send("That's cool! Small wins count too~");
    } else if (difficulty <= 6) {
      send("Nice, good job!")
    } else if (difficulty <= 9) {
      send("Wowowow, big win right there :D");
    } else if (difficulty === 10) {
      send("THAT'S AMAZING!! YOOOO I'M SO PROUD OF YOU!!")
    }

    return updateXP(msg.from.id, difficulty * DIFFICULTY_XP_MULTIPLIER)
    .then(xpData => {
      updateUserOnXPChange(msg.chat.id, "your achievement", xpData);
      return resetPrevCommand(msg.from.id);
    })
  }
}

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
  .then(({ command }) => {
    if (continueConversation[command]) {
      continueConversation[command](msg);
    } else {
      console.log('Encountered unfamiliar command: ', command)
    }
  })
  .catch(() => {});
});

bot.on("polling_error", (err) => console.log(err));

module.exports = bot;
