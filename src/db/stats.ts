import { sum, average, max } from "../utils";
import { Statistics } from "../types/data";

import * as users from "./users";
import * as reflections from "./reflections";
import * as hashtags from "./hashtags";
import * as emojisDb from "./emojis";

export const get = async (chatId: number): Promise<Statistics> => {
  const progress = users.progress.get(chatId);
  const idat = users.idat.get(chatId);
  const reflectionsCount = reflections.getCount(chatId);
  const reflectionLengths = reflections.getLengths(chatId);
  const hashtagsTotalCount = hashtags.getTotalCount(chatId);
  const hashtagsUniqueCount = hashtags.getUniqueCount(chatId);
  const emojis = emojisDb.getUser(chatId);

  return {
    progress: await progress,
    idat: await idat,
    reflections: {
      count: await reflectionsCount,
      length: {
        total: sum(await reflectionLengths),
        average: average(await reflectionLengths),
        maximum: max(await reflectionLengths),
      },
    },
    hashtags: {
      total: await hashtagsTotalCount,
      unique: await hashtagsUniqueCount,
    },
    emojis: await emojis,
  };
};
