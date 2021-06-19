const utils = require("../utils");

const users = require("./users");
const reflections = require("./reflections");
const hashtagsDb = require("./hashtags");

const get = async userId => {
  const progress = users.progress.get(userId);
  const idat = users.idat.get(userId);
  const reflectionsCount = reflections.getCount(userId);
  const reflectionLengths = reflections.getLengths(userId);
  const hashtagsTotalCount = hashtagsDb.getTotalCount(userId);
  const hashtagsUniqueCount = hashtagsDb.getUniqueCount(userId);

  return {
    progress: await progress,
    idat: await idat,
    reflections: {
      count: await reflectionsCount,
      length: {
        total: utils.sum(await reflectionLengths),
        average: utils.average(await reflectionLengths),
        maximum: utils.max(await reflectionLengths),
      },
    },
    hashtags: {
      total: await hashtagsTotalCount,
      unique: await hashtagsUniqueCount,
    },
  };
};

module.exports = {
  get,
};
