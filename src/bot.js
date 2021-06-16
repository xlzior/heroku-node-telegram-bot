const Bot = require('node-telegram-bot-api');

const {
  user,
  progress,
  reflections,
  prevCommand,
  hashtags: hashtagsDb,
  emojis: emojisDb,
  idat,
  stats,
} = require('./db');

const { getRandomPrompt, countEmojis, emojiChart, sum, cleanMarkdownReserved, formatHashtag, groupPairs } = require('./utils');
const { formatLevel } = require('./levels');
const { getBadgeImage, getBadgeLabel, BLANK_BADGE } = require('./achievements');

const token = process.env.TOKEN;

let bot;
if(process.env.NODE_ENV === 'production') {
  bot = new Bot(token);
  bot.setWebHook(process.env.HEROKU_URL + bot.token);
} else {
  bot = new Bot(token, { polling: true });
}

console.info(`Bot server started in ${process.env.NODE_ENV} mode`);

/* BOT UTILITIES */

const notifyXP = async (chatId, type, xpData) => {
  const { level, levelledUp, additionalXP, newXP, pinnedMessageId } = xpData;
  await bot.sendMessage(chatId, `You earned ${additionalXP} XP for ${type}!`);
  if (levelledUp) {
    await bot.sendMessage(chatId, `You levelled up! You are now Level ${level}.`);
  }
  await bot.editMessageText(formatLevel(level, newXP), {
    chat_id: chatId,
    message_id: pinnedMessageId,
  })
}

const notifyBadge = (chatId, type, badgeLevel) => {
  const badgeImage = getBadgeImage(type, badgeLevel);
  return bot.sendPhoto(chatId, badgeImage,
    { caption: `New Achievement! ${getBadgeLabel(type, badgeLevel)}` });
}

const sendAndPin = (chatId, message) => {
  return bot.sendMessage(chatId, message)
  .then(botMsg => {
    bot.pinChatMessage(chatId, botMsg.message_id);
    return botMsg.message_id;
  })
}

// depending on the number of photos, send the appropriate number of media groups
const sendPhotos = async (chatId, photos) => {
  if (photos.length === 1) { // send an individual photo
    const { media, caption } = photos[0]
    await bot.sendPhoto(chatId, media, { caption })
  } else if (photos.length <= 10) { // send a media group
    await bot.sendMediaGroup(chatId, photos);
  } else { // send multiple media groups
    await bot.sendMediaGroup(chatId, photos.slice(0, 10)); // send the first 10
    await sendPhotos(chatId, photos.slice(10));            // recurse for the rest
  }
}

const FORCE_REPLY = { reply_markup: { force_reply: true } };
const REMOVE_KEYBOARD = { reply_markup: { remove_keyboard: true } };
const MARKDOWN = { parse_mode: "MarkdownV2" };

/* BOT RESPONSES */

const continueConversation = {};

bot.onText(/\/prompt/, msg => {
  bot.sendMessage(msg.chat.id, getRandomPrompt());
});

bot.onText(/\/echo (.+)/, (msg, match) => {
  bot.sendMessage(msg.chat.id, match[1]);
});

bot.onText(/\/echo\s*$/, (msg) => {
  bot.sendMessage(msg.chat.id, "Send /echo [text], and I'll repeat the [text] back at you. This can be useful for prompting yourself with a question you already have in mind, or telling yourself something you need/want to hear.")
})

bot.onText(/\/start/, msg => {
  const userId = msg.from.id;
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, `Hello, ${msg.from.first_name}! Welcome to LifeXP, a gamified journalling chatbot.`);

  user.create(userId)
  .then(() => sendAndPin(chatId, formatLevel(1, 0)))
  .then(messageId => progress.setPinnedMessageId(userId, messageId));
})

bot.onText(/\/help/, msg => {
  const helpMessage = [
    "Welcome to LifeXP, a gamified journalling chatbot.\n",
    "I'm here to help you pen down your thoughts in a safe and convenient environment.\n",
    "Use /open to start a new journal entry.",
    "If you need a prompt to start off, let me know using /prompt.",
    "If you did something that you're proud of and want to celebrate it, try /ididathing.",
    "Finally, /close the journal entry and let your mind rest.\n",
    "I hope you have a meaningful journalling session."
  ].join("\n");
  bot.sendMessage(msg.chat.id, helpMessage)
})

bot.onText(/\/open/, msg => {
  reflections.open(msg.from.id, msg.message_id)
  .then(() => {
    bot.sendMessage(msg.chat.id, "Let's start a journalling session! If you need a prompt, you can use /prompt. If not, just start typing and I'll be here when you need me.")
  })
  .catch(error => {
    bot.sendMessage(msg.chat.id, error);
  });
})

bot.onText(/\/close/, msg => {
  reflections.isOpen(msg.from.id)
  .then(isOpen => {
    if (isOpen) {
      bot.sendMessage(msg.chat.id, "Whew! Nice journalling session. How would you like to name this conversation for future browsing?", FORCE_REPLY)
      prevCommand.update(msg.from.id, { command: "close" })
    } else {
      bot.sendMessage(msg.chat.id, "You have not started a reflection. Use /open to start a new reflection");
    }
  })
  .catch(error => {
    console.error(error)
  })
})

continueConversation["close"] = async (msg) => {
  try {
    const userId = msg.from.id;
    const chatId = msg.chat.id;
    await bot.sendMessage(chatId, `Good job! You wrapped up the '${msg.text}' conversation. I'm proud of you!`)

    // emojis
    const emojis = await emojisDb.get(userId);
    const emojiCounts = Object.values(emojis);
    if (emojiCounts.length >= 2 && sum(emojiCounts) >= 5) {
      await bot.sendMessage(chatId, `You used these emojis in this entry:\n${emojiChart(emojis)}`)
    }
    
    // XP
    const closureStats = await reflections.close(userId, msg.message_id, msg.text);
    const { convoLength, newAchievements } = closureStats;
    const xpData = await progress.addXP(msg.from.id, convoLength);
    await notifyXP(chatId, "this conversation", xpData);

    // achievements
    for (const type in newAchievements) {
      const { previousLevel, currentLevel } = newAchievements[type];
      for (let i = previousLevel + 1; i <= currentLevel; i++) {
        await notifyBadge(chatId, type, i);
      }
    }
    // TODO: emojis achievement

    // close the loop
    prevCommand.reset(userId);
  } catch (error) {
    console.error(error);
  }
}

bot.onText(/\/hashtags/, msg => {
  hashtagsDb.get(msg.from.id)
  .then(hashtags => {
    const message = hashtags.map(formatHashtag(3)).join('\n\n');
    bot.sendMessage(msg.chat.id, cleanMarkdownReserved(message), MARKDOWN);
  })
  .catch(error => {
    bot.sendMessage(msg.chat.id, error);
  })
});

bot.onText(/\/hashtag$/, async (msg) => {
  prevCommand.update(msg.from.id, { command: "hashtag" });
  const hashtags = await hashtagsDb.get(msg.from.id)
  const keyboard = groupPairs(hashtags.map(({ hashtag }) => hashtag));
  bot.sendMessage(msg.chat.id, "Alright, which hashtag would you like to browse?", {
    reply_markup: {
      keyboard,
      resize_keyboard: true,
      one_time_keyboard: true,
    }
  });
})

continueConversation['hashtag'] = async (msg) => {
  const hashtags = await hashtagsDb.get(msg.from.id);
  const hashtag = hashtags.find(({ hashtag }) => hashtag === msg.text);
  const message = formatHashtag(20)(hashtag);
  bot.sendMessage(msg.chat.id, cleanMarkdownReserved(message), { ...MARKDOWN, ...REMOVE_KEYBOARD });
  prevCommand.reset(msg.from.id);
}

bot.onText(/\/goto(\d+)/, (msg, match) => {
  bot.sendMessage(msg.chat.id, "The conversation started here!", {
    reply_to_message_id: match[1]
  })
})

bot.onText(/\/lifexp/, msg => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  progress.getProgress(userId)
  .then(({ level, xp, pinnedMessageId }) => {
    bot.unpinChatMessage(chatId, { message_id: pinnedMessageId });
    sendAndPin(chatId, formatLevel(level, xp))
    .then(messageId => progress.setPinnedMessageId(userId, messageId));
  });
})

bot.onText(/\/ididathing/, msg => {
  bot.sendMessage(msg.chat.id, "Congrats! Whether it's a small win or a big win, let's celebrate it!")
  .then(() => {
    bot.sendMessage(msg.chat.id, "So tell me, what did you do?", FORCE_REPLY);
  })
  prevCommand.update(msg.from.id, { command: "idat - what" });
})

continueConversation["idat - what"] = msg => {
  bot.sendMessage(msg.chat.id, "Amazing! How do you feel about it now?", FORCE_REPLY);
  prevCommand.update(msg.from.id, { command: "idat - feeling" });
}

continueConversation["idat - feeling"] = msg => {
  bot.sendMessage(msg.chat.id, "Nice~ On a scale of 1 to 10, how difficult would you rate it?", FORCE_REPLY);
  prevCommand.update(msg.from.id, { command: "idat - difficulty" });
}

const DIFFICULTY_XP_MULTIPLIER = 100;

continueConversation["idat - difficulty"] = async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const send = message => bot.sendMessage(chatId, message);
  const match = msg.text.match(/\d+/);
  if (!match) return send("Please enter a valid number between 1 and 10 (inclusive)");

  const difficulty = parseInt(match[0]);
  if (difficulty < 1 || difficulty > 10) {
    send("Please enter a valid number between 1 and 10 (inclusive)");
  } else {
    // user feedback
    if (difficulty <= 3) {
      send("That's cool! Small wins count too~");
    } else if (difficulty <= 6) {
      send("Nice, good job!")
    } else if (difficulty <= 9) {
      send("Wowowow, big win right there :D");
    } else if (difficulty === 10) {
      send("THAT'S AMAZING!! YOOOO I'M SO PROUD OF YOU!!")
    }

    // give XP
    const xpData = await progress.addXP(userId, difficulty * DIFFICULTY_XP_MULTIPLIER);
    await notifyXP(chatId, "your achievement", xpData);
    
    // give badge
    const { hasNewBadge, previousLevel, currentLevel } = await idat.increment(userId);
    if (hasNewBadge) {
      for (let i = previousLevel + 1; i <= currentLevel; i++) {
        await notifyBadge(chatId, 'idat', i);
      }
    }
    
    return prevCommand.reset(userId);
  }
}

bot.onText(/\/stats/, msg => {
  stats.getStats(msg.from.id)
  .then((stats) => {
    const {
      level, xp,
      reflections, totalLength, averageLength, maximumLength,
      hashtags, uniqueHashtags,
      idat
    } = stats;
    const statsDisplay = [
      `*Level*: ${level}\n*Total XP*: ${xp}`,
      `*Journal entries*: ${reflections}
      ${totalLength} message(s) total
      ${Math.round(averageLength)} message(s) per reflection (average)
      Longest entry: ${maximumLength} message(s)`,
      `*Hashtags used*: ${hashtags}
      ${uniqueHashtags} unique hashtags
      <i>(use /hashtags to browse)</i>`,
      `*Great things done*: ${idat}`,
    ]
    const message = statsDisplay.join('\n\n');
    bot.sendMessage(msg.chat.id, cleanMarkdownReserved(message), MARKDOWN)
  })
})

bot.onText(/\/achievements/, async msg => {
  const achievements = await stats.getAchievements(msg.from.id);
  const achievementsCount = sum(Object.values(achievements));

  // TODO: delete all previous badges sent? so that it's not so repetitive

  if (achievementsCount === 0) {
    return bot.sendMessage(msg.chat.id, "Oh no! You haven't earned any achievements yet. Keep journalling to earn some!")
  }
  
  const photos = [];
  for (const type in achievements) {
    const badgeLevel = achievements[type];
    for (let i = 3; i >= 1; i--) {
      photos.push({
        type: "photo",
        media: i <= badgeLevel ? getBadgeImage(type, i) : BLANK_BADGE,
        caption: i <= badgeLevel ? getBadgeLabel(type, i) : ""
      });
    }
  }
  await bot.sendMessage(msg.chat.id, "Resending your achievements...");
  await sendPhotos(msg.chat.id, photos);
  await bot.sendMessage(msg.chat.id, "Tip: View the chat's 'shared media' to see a display cabinet of all your achievement badges!")
});

bot.onText(/\/cancel/, async (msg) => {
  await prevCommand.reset(msg.from.id)
  bot.sendMessage(msg.chat.id, "The previous command has been cancelled.");
})

// Messages with no command

bot.on('message', msg => {
  // console.log(msg.photo[2].file_id);
  const userId = msg.from.id;

  // TODO: automatically open a conversation for a smoother journalling experience?

  if (msg.entities) {
    const hashtags = msg.entities
      .filter(({ type }) => type === 'hashtag')
      .map(({ offset, length }) => msg.text.substr(offset, length));
    hashtagsDb.add(userId, hashtags);
  }

  emojisDb.add(userId, countEmojis(msg.text));

  if (msg.text !== '/cancel') {
    prevCommand.get(userId)
    .then(({ command }) => {
      if (continueConversation[command]) {
        continueConversation[command](msg);
      } else {
        console.error('Encountered unfamiliar command: ', command)
      }
    })
    .catch(() => {});
  }
});

bot.on("polling_error", (err) => console.error(err));

module.exports = bot;
