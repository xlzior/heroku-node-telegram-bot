const db = require("../db");
const errors = require("../db/errors");
const utils = require("../utils");
const { checkForNewBadge } = require("../achievements");

function handleReflections({ bot, continueConversation }) {
  bot.onText(/\/prompt/, ({ send }) => {
    send(utils.getRandomPrompt());
  });

  bot.onText(/\/echo(@lifexp_bot)? (.+)/, ({ send }, msg, match) => {
    send(match[2]);
  });

  bot.onText(/\/echo(@lifexp_bot)?$/, ({ send }) => {
    send("Send /echo [text], and I'll repeat the [text] back at you. This can be useful for prompting yourself with a question you already have in mind, or telling yourself something you need/want to hear.");
  });

  bot.onText(/\/open/, async ({ send, userId }, msg) => {
    try {
      await db.reflections.open(userId, msg.message_id);
      send("Let's start a journalling session! If you need a prompt, you can use /prompt. If not, just start typing and I'll be here when you need me.");
    } catch (error) {
      if (error === errors.REFLECTION_ALREADY_OPEN) {
        send("A reflection is already in progress, please /close the reflection before opening a new one.");
      } else {
        console.error("error:", error);
      }
    }
  });

  bot.onText(/\/close/, async ({ send, userId }) => {
    const isOpen = await db.reflections.isOpen(userId);
    if (isOpen) {
      send("Whew! Nice journalling session. How would you like to name this reflection for future browsing?",
        utils.telegram.FORCE_REPLY);
      db.users.prevCommand.set(userId, "close");
    } else {
      send("You have not started a reflection. Use /open to start a new reflection");
      db.users.prevCommand.reset(userId);
    }
  });

  continueConversation["close"] = async ({ send, userId, chatId }, msg) => {
    await send(`Good job! You wrapped up the '${msg.text}' reflection. I'm proud of you!`);

    // emojis
    const emojis = await db.emojis.getCurrent(userId);
    const emojiCounts = emojis.map(({ count }) => count);
    if (emojis.length >= 2 && utils.sum(emojiCounts) >= 5) {
      await send(`You used these emojis in this entry:\n\n${utils.emojiChart(emojis)}`);
    }

    // XP
    const convoLength = await db.reflections.close(userId, msg.message_id, msg.text)
      .catch(error => {
        if (error === errors.NO_REFLECTION_OPEN) {
          send("You have not started a reflection. Use /open to start a new reflection");
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
      { type: "emojis", value: await db.emojis.getCount(userId) },
    ];

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

  bot.onMessage(async ({ userId }, msg) => {
    // KIV: automatically open a reflection for a smoother journalling experience?

    if (msg.entities) {
      const hashtags = msg.entities
        .filter(({ type }) => type === "hashtag")
        .map(({ offset, length }) => msg.text.substr(offset, length));
      db.hashtags.add(userId, hashtags);
    }

    db.emojis.add(userId, utils.countEmojis(msg.text));
  });
}

module.exports = handleReflections;
