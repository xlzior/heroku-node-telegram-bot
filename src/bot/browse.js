const db = require("../db");
const utils = require("../utils");

const {
  clean, MARKDOWN,
  groupPairs, withKeyboard, withInlineKeyboard, REMOVE_KEYBOARD,
  replyTo,
} = utils.telegram;

const REFLECTIONS_PER_PAGE = 5;
const pageToOffset = page => 5 * (page - 1);
const countToNumPages = count => Math.ceil(count / REFLECTIONS_PER_PAGE);

const generatePagination = type => (currentPage, lastPage) => {
  if (lastPage === 1) return null;

  const first = { text: "<< 1", callback_data: `${type} - ${1}` };
  const prev = { text: `< ${currentPage - 1}`, callback_data: `${type} - ${currentPage - 1}` };
  const current = { text: currentPage, callback_data: `${type} - ${"current"}` };
  const next = { text: `${currentPage + 1} >`, callback_data: `${type} - ${currentPage + 1}` };
  const last = { text: `${lastPage} >>`, callback_data: `${type} - ${lastPage}` };

  const result = [current];

  if (currentPage > 1) result.unshift(prev);
  if (currentPage > 2) result.unshift(first);
  if (currentPage < lastPage) result.push(next);
  if (currentPage < lastPage - 1) result.push(last);

  return [result.filter(Boolean)];
};

const generateReflectionsList = async (userId, currentPage) => {
  // reflections
  const reflections = await db.reflections.get(
    userId, REFLECTIONS_PER_PAGE, pageToOffset(currentPage));
  if (reflections.length === 0) {
    return {
      error: true,
      message: "You do not have any reflections. Use /open to start a new journal entry",
      options: {},
    };
  }
  const reflectionsList = reflections.map(utils.formatReflection).join("\n\n");

  // pagination
  const reflectionsCount = await db.reflections.getCount(userId);
  const lastPage = countToNumPages(reflectionsCount);
  const keyboard = generatePagination("reflections")(currentPage, lastPage);

  const message = [
    clean(reflectionsList),
    `Page ${currentPage} of ${lastPage}`,
  ].join("\n\n");
  const options = { ...MARKDOWN, ...withInlineKeyboard(keyboard) };
  return { message, options };
};

const generateHashtagList = async (userId, hashtag, currentPage) => {
  // reflections
  const reflections = await db.hashtags.get(userId, hashtag,
    REFLECTIONS_PER_PAGE, pageToOffset(currentPage));
  if (reflections.length === 0) {
    return {
      error: true,
      message: `Sorry, I don't recognise the hashtag '${hashtag}'. Please select a hashtag from the list.`,
      options: {},
    };
  }
  const reflectionsList = reflections.map(utils.formatReflection).join("\n\n");

  // pagination
  const reflectionsCount = await db.hashtags.getCount(userId, hashtag);
  const lastPage = countToNumPages(reflectionsCount);
  const keyboard = generatePagination(`hashtag - ${hashtag}`)(currentPage, lastPage);

  const message = clean([
    reflectionsList,
    `Page ${currentPage} of ${lastPage}`,
  ].join("\n\n"));
  const options = { ...MARKDOWN, ...withInlineKeyboard(keyboard) };
  return { message, options };
};

function handleBrowse({ bot, continueConversation }) {
  bot.onText(/\/reflections/, async ({ send, userId }) => {
    const { error = false, message, options } = await generateReflectionsList(userId, 1);
    if (!error) send("All reflections");
    send(message, options);
  });

  bot.on("callback_query", async ({ id, from, message: msg, data }) => {
    const [type, pageNumber] = data.split(" - ");
    if (type === "reflections") {
      if (pageNumber === "current") return;
      const { message, options } = await generateReflectionsList(from.id, parseInt(pageNumber));
      bot.editMessageText(message, {
        ...options,
        chat_id: msg.chat.id,
        message_id: msg.message_id,
      });
      bot.answerCallbackQuery(id);
    }
  });

  bot.onText(/\/hashtags/, async ({ send, userId }) => {
    const hashtags = await db.hashtags.getAll(userId);
    if (hashtags.length === 0) {
      return send("You have no hashtags saved. /open a reflection and use hashtags to categorise your entries.");
    }
    const message = `You've used these hashtags in your reflections:
    \n${hashtags.map(utils.formatHashtag).join("\n")}`;
    await send(clean(message), MARKDOWN);
    await send("Use /hashtag to view all reflections with a particular hashtag");
  });

  bot.onText(/\/hashtag(@lifexp_bot)?$/, async ({ send, userId }) => {
    const hashtags = await db.hashtags.getAll(userId);
    if (hashtags.length === 0) {
      return send("You have no hashtags saved. /open a reflection and use hashtags to categorise your entries.");
    }
    db.users.prevCommand.set(userId, "hashtag");
    const keyboard = groupPairs(hashtags.map(({ hashtag }) => hashtag));
    send("Alright, which hashtag would you like to browse?", withKeyboard(keyboard));
  });

  continueConversation["hashtag"] = async ({ send, userId }, msg) => {
    const { error = false, message, options } = await generateHashtagList(userId, msg.text, 1);
    if (!error) send(`Reflections with the hashtag ${msg.text}`, REMOVE_KEYBOARD);
    send(message, options);
    db.users.prevCommand.reset(userId);
  };

  bot.on("callback_query", async ({ id, from, message: msg, data }) => {
    const [type, hashtag, pageNumber] = data.split(" - ");
    if (type === "hashtag") {
      if (pageNumber === "current") return;

      const { message, options } = await generateHashtagList(
        from.id, hashtag, parseInt(pageNumber));
      bot.editMessageText(message, {
        ...options,
        chat_id: msg.chat.id,
        message_id: msg.message_id,
      });
      bot.answerCallbackQuery(id);
    }
  });

  bot.onText(/\/goto(\d+)/, ({ send }, msg, match) => {
    send("The reflection started here!", replyTo(match[1]))
    .catch(() => send("Reflection not found."));
  });
}

module.exports = handleBrowse;
