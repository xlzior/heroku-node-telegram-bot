import * as reflectionsDb from "../db/reflections";
import * as hashtagsDb from "../db/hashtags";
import * as questsDb from "../db/quests";

import { clean, MARKDOWN, withInlineKeyboard } from "./telegram";
import { formatReflection, formatHashtag, formatQuest } from "./misc";

const pageToOffset = (perPage: number) => (page: number) => perPage * (page - 1);
const countToNumPages = (perPage: number) => (count: number) => Math.ceil(count / perPage);

const generatePagination = (type: string) =>
  (currentPage: number, lastPage: number) => {
  if (lastPage === 1) return null;

  const first = { text: "<< 1", callback_data: `${type} - ${1}` };
  const prev = { text: `< ${currentPage - 1}`, callback_data: `${type} - ${currentPage - 1}` };
  const current = { text: currentPage.toString(), callback_data: `${type} - current` };
  const next = { text: `${currentPage + 1} >`, callback_data: `${type} - ${currentPage + 1}` };
  const last = { text: `${lastPage} >>`, callback_data: `${type} - ${lastPage}` };

  const result = [current];

  if (currentPage > 1) result.unshift(prev);
  if (currentPage > 2) result.unshift(first);
  if (currentPage < lastPage) result.push(next);
  if (currentPage < lastPage - 1) result.push(last);

  return [result.filter(Boolean)];
};

const generateList = (
  getPaginationType,
  perPage: number,
  getEntities,
  getNoEntitiesMessage,
  formatEntities,
  getCount,
) => async (chatId: number, ...data) => {
  const currentPage = data[data.length - 1];

  // entities
  const entities = await getEntities(chatId, data, perPage);
  if (entities.length === 0) {
    return { error: true, message: getNoEntitiesMessage(chatId, data), options: {} };
  }
  const list = formatEntities(entities);

  // pagination
  const lastPage = await getCount(chatId, data).then(countToNumPages(perPage));
  const keyboard = generatePagination(getPaginationType(chatId, data))(currentPage, lastPage);

  // assemble the message
  const message = [
    clean(list),
    `Page ${currentPage} of ${lastPage}`,
  ].join("\n\n");
  const options = { ...MARKDOWN, ...withInlineKeyboard(keyboard) };
  return { message, options };
};

// callback_data: `reflections - ${pageNumber}`
// data = [pageNumber]
export const generateReflectionsList = generateList(
  () => "reflections",
  5,
  (chatId: number, data, perPage: number) =>
    reflectionsDb.get(chatId, perPage, pageToOffset(perPage)(data[0])),
  () => "You do not have any reflections. Use /open to start a new journal entry",
  reflections => reflections.map(formatReflection).join("\n\n"),
  (chatId: number) => reflectionsDb.getCount(chatId),
);

// callback_data: `hashtag - ${hashtag} - ${pageNumber}`
// data = [hashtag, pageNumber]
export const generateHashtagList = generateList(
  (_chatId, data) => `hashtag - ${data[0]}`,
  5,
  (chatId, data, perPage: number) =>
    hashtagsDb.get(chatId, data[0], perPage, pageToOffset(perPage)(data[1])),
  (_chatId, data) => `Sorry, I don't recognise the hashtag '${data[0]}'. Please select a hashtag from the list.`,
  reflections => reflections.map(formatReflection).join("\n\n"),
  (chatId: number, data) => hashtagsDb.getCount(chatId, data[0]),
);

// callback_data: `hashtags - ${pageNumber}`
// data = [pageNumber]
export const generateHashtagsList = generateList(
  () => "hashtags",
  25,
  (chatId: number, data, perPage: number) =>
    hashtagsDb.getAll(chatId, perPage, pageToOffset(perPage)(data[0])),
  () => "You have no hashtags saved. /open a reflection and use hashtags to categorise your entries.",
  hashtags => hashtags.map(formatHashtag).join("\n"),
  chatId => hashtagsDb.getUniqueCount(chatId),
);

// callback_data: `quests`
// data = [pageNumber]
export const generateQuestsList = generateList(
  () => "quests",
  5,
  (_chatId: number, data, perPage: number) =>
    questsDb.getAll(perPage, pageToOffset(perPage)(data[0])),
  () => "No quests found.",
  quests => quests.map(formatQuest).join("\n\n"),
  () => questsDb.getCount(),
);
