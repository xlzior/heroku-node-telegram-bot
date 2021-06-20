const Bot = require("./TelegramBot");

const db = require("./db");
const errors = require("./db/errors");
const utils = require("./utils");

// TODO: refactor into gameUtils?
const { formatLevel } = require("./levels");
const { getBadgeImage, getBadgeLabel, checkForNewBadge, BLANK_BADGE } = require("./achievements");

const token = process.env.TOKEN;

let bot;
if (process.env.NODE_ENV === "production") {
  bot = new Bot(token);
  bot.setWebHook(process.env.HEROKU_URL + bot.token);
} else {
  bot = new Bot(token, { polling: true });
}

console.info(`Bot server started in ${process.env.NODE_ENV} mode`);

/* MESSAGE MODIFIERS */

const FORCE_REPLY = { reply_markup: { force_reply: true } };
const REMOVE_KEYBOARD = { reply_markup: { remove_keyboard: true } };
const MARKDOWN = { parse_mode: "MarkdownV2" };

const withKeyboard = (keyboard, resize_keyboard = true, one_time_keyboard = true) => {
  return { reply_markup: { keyboard, resize_keyboard, one_time_keyboard } };
};

/* BOT RESPONSES */

const continueConversation = {};

bot.onText(/\/prompt/, msg => {
  bot.sendMessage(msg.chat.id, utils.getRandomPrompt());
});

bot.onText(/\/echo(@lifexp_bot)? (.+)/, (msg, match) => {
  bot.sendMessage(msg.chat.id, match[2]);
});

bot.onText(/\/echo(@lifexp_bot)?$/, msg => {
  bot.sendMessage(msg.chat.id, "Send /echo [text], and I'll repeat the [text] back at you. This can be useful for prompting yourself with a question you already have in mind, or telling yourself something you need/want to hear.");
});

bot.onText(/\/start/, async msg => {
  const userId = msg.from.id;
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, `Hello, ${msg.from.first_name}! Welcome to LifeXP, a gamified journalling chatbot.`);

  await db.users.create(userId);
  const messageId = await bot.sendAndPin(chatId, formatLevel(1, 0));
  db.users.pinnedMessageId.set(userId, messageId);
});

bot.onText(/\/help/, msg => {
  const helpMessage = [
    "Welcome to LifeXP, a gamified journalling chatbot.\n",
    "I'm here to help you pen down your thoughts in a safe and convenient environment.\n",
    "Use /open to start a new journal entry.",
    "If you need a prompt to start off, let me know using /prompt.",
    "If you did something that you're proud of and want to celebrate it, try /ididathing.",
    "Finally, /close the journal entry and let your mind rest.\n",
    "I hope you have a meaningful journalling session.",
  ].join("\n");
  bot.sendMessage(msg.chat.id, helpMessage);
});

bot.onText(/\/open/, async msg => {
  try {
    await db.reflections.open(msg.from.id, msg.message_id);
    bot.sendMessage(msg.chat.id, "Let's start a journalling session! If you need a prompt, you can use /prompt. If not, just start typing and I'll be here when you need me.");
  } catch (error) {
    if (error === errors.REFLECTION_ALREADY_OPEN) {
      bot.sendMessage(msg.chat.id, "A reflection is already in progress, please /close the reflection before opening a new one.");
    } else {
      console.error("error:", error);
    }
  }
});

bot.onText(/\/close/, async msg => {
  const isOpen = await db.reflections.isOpen(msg.from.id);
  if (isOpen) {
    bot.sendMessage(msg.chat.id, "Whew! Nice journalling session. How would you like to name this reflection for future browsing?", FORCE_REPLY);
    db.users.prevCommand.set(msg.from.id, "close");
  } else {
    bot.sendMessage(msg.chat.id, "You have not started a reflection. Use /open to start a new reflection");
    db.users.prevCommand.reset(msg.from.id);
  }
});

continueConversation["close"] = async msg => {
  const userId = msg.from.id;
  const chatId = msg.chat.id;
  await bot.sendMessage(chatId, `Good job! You wrapped up the '${msg.text}' reflection. I'm proud of you!`);

  // emojis
  const emojis = await db.emojis.getCurrent(userId);
  const emojiCounts = emojis.map(({ count }) => count);
  if (emojis.length >= 2 && utils.sum(emojiCounts) >= 5) {
    await bot.sendMessage(chatId, `You used these emojis in this entry:\n\n${utils.emojiChart(emojis)}`);
  }

  // XP
  const convoLength = await db.reflections.close(userId, msg.message_id, msg.text)
    .catch(error => {
      if (error === errors.NO_REFLECTION_OPEN) {
        bot.sendMessage(msg.chat.id, "You have not started a reflection. Use /open to start a new reflection");
      } else {
        console.error("error:", error);
      }
    });

  const xpData = await db.users.progress.addXP(userId, convoLength);
  await bot.notifyXP(chatId, "this reflection", xpData);

  // achievements
  const stats = [
    { type: "convoLength", value: convoLength },
    { type: "reflections", value: await db.reflections.getCount(userId) },
    { type: "hashtags", value: await db.hashtags.getTotalCount(userId) },
  ];
  // KIV: emojis achievement?

  const achievements = await db.achievements.getAll(userId);

  stats.forEach(async ({ type, value }) => {
    const previousAchievement = achievements.find(elem => elem.type === type);
    const previousLevel = previousAchievement ? previousAchievement.level : 0;
    const { hasNewBadge, currentLevel } = checkForNewBadge(type, previousLevel, value);
    if (hasNewBadge) {
      await bot.notifyBadges(chatId, type, previousLevel, currentLevel);
      db.achievements.update(userId, type, currentLevel);
    }
  });

  // close the loop
  db.users.prevCommand.reset(userId);
};

bot.onText(/\/hashtags/, async msg => {
  const hashtags = await db.hashtags.get(msg.from.id);
  if (hashtags.length === 0) {
    return bot.sendMessage(msg.chat.id, "You have no hashtags saved. /open a reflection and use hashtags to categorise your entries.");
  }
  const message = "Showing the 5 most recent reflections for all hashtags\n\n" + hashtags.map(utils.formatHashtag(5)).join("\n\n");
  await bot.sendMessage(msg.chat.id, utils.cleanMarkdownReserved(message), MARKDOWN);
  await bot.sendMessage(msg.chat.id, "Tip: Use /hashtag to view all reflections with a particular hashtag");
});

bot.onText(/\/hashtag(@lifexp_bot)?$/, async msg => {
  const hashtags = await db.hashtags.get(msg.from.id);
  if (hashtags.length === 0) {
    return bot.sendMessage(msg.chat.id, "You have no hashtags saved. /open a reflection and use hashtags to categorise your entries.");
  }
  db.users.prevCommand.set(msg.from.id, "hashtag");
  const keyboard = utils.groupPairs(hashtags.map(({ hashtag }) => hashtag));
  bot.sendMessage(msg.chat.id, "Alright, which hashtag would you like to browse?",
    withKeyboard(keyboard));
});

continueConversation["hashtag"] = async msg => {
  const hashtags = await db.hashtags.get(msg.from.id);
  const hashtag = hashtags.find(({ hashtag }) => hashtag === msg.text);

  if (!hashtag) {
    return bot.sendMessage(msg.chat.id, `Sorry, I don't recognise the hashtag '${msg.text}'. Please select a hashtag from the list.`);
  }

  const message = `Showing all reflections with the hashtag ${msg.text}\n\n` + utils.formatHashtag()(hashtag);
  bot.sendMessage(msg.chat.id, utils.cleanMarkdownReserved(message),
    { ...MARKDOWN, ...REMOVE_KEYBOARD });
  db.users.prevCommand.reset(msg.from.id);
};

bot.onText(/\/goto(\d+)/, (msg, match) => {
  bot.sendMessage(msg.chat.id, "The reflection started here!", {
    reply_to_message_id: match[1],
  });
});

bot.onText(/\/lifexp/, async msg => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const { level, xp, pinnedMessageId } = await db.users.progress.get(userId);
  bot.unpinChatMessage(chatId, { message_id: pinnedMessageId });
  const messageId = await bot.sendAndPin(chatId, formatLevel(level, xp));
  db.users.pinnedMessageId.set(userId, messageId);
});

bot.onText(/\/ididathing/, async msg => {
  await bot.sendMessage(msg.chat.id, "Congrats! Whether it's a small win or a big win, let's celebrate it!");
  bot.sendMessage(msg.chat.id, "So tell me, what did you do?", FORCE_REPLY);
  db.users.prevCommand.set(msg.from.id, "idat - what");
});

continueConversation["idat - what"] = msg => {
  bot.sendMessage(msg.chat.id, "Amazing! How do you feel about it now?", FORCE_REPLY);
  db.users.prevCommand.set(msg.from.id, "idat - feeling");
};

continueConversation["idat - feeling"] = msg => {
  bot.sendMessage(msg.chat.id, "Nice~ On a scale of 1 to 10, how difficult would you rate it?", FORCE_REPLY);
  db.users.prevCommand.set(msg.from.id, "idat - difficulty");
};

const DIFFICULTY_XP_MULTIPLIER = 100;

continueConversation["idat - difficulty"] = async msg => {
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
      send("Nice, good job!");
    } else if (difficulty <= 9) {
      send("Wowowow, big win right there :D");
    } else if (difficulty === 10) {
      send("THAT'S AMAZING!! YOOOO I'M SO PROUD OF YOU!!");
    }

    // give XP
    const xpData = await db.users.progress.addXP(userId, difficulty * DIFFICULTY_XP_MULTIPLIER);
    await bot.notifyXP(chatId, "your achievement", xpData);

    // give badge
    const { hasNewBadge, previousLevel, currentLevel } = await db.users.idat.increment(userId);
    if (hasNewBadge) {
      await bot.notifyBadges(chatId, "idat", previousLevel, currentLevel);
    }

    return db.users.prevCommand.reset(userId);
  }
};

bot.onText(/\/stats/, async msg => {
  const { progress, idat, reflections, hashtags } = await db.stats.get(msg.from.id);

  const statsDisplay = [
    `*Level*: ${progress.level}\n*Total XP*: ${progress.xp}`,
    `*Journal entries*: ${reflections.count}
    ${reflections.length.total} message(s) total
    ${Math.round(reflections.length.average)} message(s) per reflection (average)
    Longest entry: ${reflections.length.maximum} message(s)`,
    `*Hashtags used*: ${hashtags.total}
    ${hashtags.unique} unique hashtags
    <i>(use /hashtags to browse)</i>`,
    `*Great things done*: ${idat}`,
  ];
  const message = statsDisplay.join("\n\n");
  bot.sendMessage(msg.chat.id, utils.cleanMarkdownReserved(message), MARKDOWN);
});

bot.onText(/\/achievements/, async msg => {
  const achievements = await db.achievements.getAll(msg.from.id);
  const achievementsCount = utils.sum(Object.values(achievements));

  // KIV: delete all previous badges sent? so that it's not so repetitive

  if (achievementsCount === 0) {
    return bot.sendMessage(msg.chat.id, "Oh no! You haven't earned any achievements yet. Keep journalling to earn some!");
  }

  const photos = [];
  achievements.forEach(({ type, level }) => {
    for (let i = 3; i >= 1; i--) {
      photos.push({
        type: "photo",
        media: i <= level ? getBadgeImage(type, i) : BLANK_BADGE,
        caption: i <= level ? getBadgeLabel(type, i) : "",
      });
    }
  });
  await bot.sendMessage(msg.chat.id, "Resending your achievements...");
  await bot.sendPhotos(msg.chat.id, photos);
  await bot.sendMessage(msg.chat.id, "Tip: View the chat's 'shared media' to see a display cabinet of all your achievement badges!");
});

bot.onText(/\/cancel/, async msg => {
  await db.users.prevCommand.reset(msg.from.id);
  bot.sendMessage(msg.chat.id, "The previous command has been cancelled.");
});

// Messages with no command

bot.on("message", async msg => {
  // console.log(msg.photo[2].file_id);
  const userId = msg.from.id;

  // KIV: automatically open a reflection for a smoother journalling experience?

  if (msg.entities) {
    const hashtags = msg.entities
      .filter(({ type }) => type === "hashtag")
      .map(({ offset, length }) => msg.text.substr(offset, length));
    db.hashtags.add(userId, hashtags);
  }

  db.emojis.add(userId, utils.countEmojis(msg.text));

  if (msg.text && !msg.text.startsWith("/cancel")) {
    const command = await db.users.prevCommand.get(userId);
    if (continueConversation[command]) {
      continueConversation[command](msg);
    } else if (command) {
      console.error("Encountered unfamiliar command: ", command);
    }
  }
});

bot.on("polling_error", err => console.error(err));

module.exports = bot;
