const reflectionsDb = require("../db/reflections");
const hashtagsDb = require("../db/hashtags");

const { clean, MARKDOWN, withInlineKeyboard } = require("./telegram");
const { formatReflection } = require("./misc");

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

const generateReflectionsList = async (chatId, currentPage) => {
  // reflections
  const reflections = await reflectionsDb.get(
    chatId, REFLECTIONS_PER_PAGE, pageToOffset(currentPage));
  if (reflections.length === 0) {
    return {
      error: true,
      message: "You do not have any reflections. Use /open to start a new journal entry",
      options: {},
    };
  }
  const reflectionsList = reflections.map(formatReflection).join("\n\n");

  // pagination
  const reflectionsCount = await reflectionsDb.getCount(chatId);
  const lastPage = countToNumPages(reflectionsCount);
  const keyboard = generatePagination("reflections")(currentPage, lastPage);

  const message = [
    clean(reflectionsList),
    `Page ${currentPage} of ${lastPage}`,
  ].join("\n\n");
  const options = { ...MARKDOWN, ...withInlineKeyboard(keyboard) };
  return { message, options };
};

const generateHashtagList = async (chatId, hashtag, currentPage) => {
  // reflections
  const reflections = await hashtagsDb.get(chatId, hashtag,
    REFLECTIONS_PER_PAGE, pageToOffset(currentPage));
  if (reflections.length === 0) {
    return {
      error: true,
      message: `Sorry, I don't recognise the hashtag '${hashtag}'. Please select a hashtag from the list.`,
      options: {},
    };
  }
  const reflectionsList = reflections.map(formatReflection).join("\n\n");

  // pagination
  const reflectionsCount = await hashtagsDb.getCount(chatId, hashtag);
  const lastPage = countToNumPages(reflectionsCount);
  const keyboard = generatePagination(`hashtag - ${hashtag}`)(currentPage, lastPage);

  const message = clean([
    reflectionsList,
    `Page ${currentPage} of ${lastPage}`,
  ].join("\n\n"));
  const options = { ...MARKDOWN, ...withInlineKeyboard(keyboard) };
  return { message, options };
};

module.exports = {
  generateReflectionsList,
  generateHashtagList,
};
