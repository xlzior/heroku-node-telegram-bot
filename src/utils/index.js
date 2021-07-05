const telegram = require("./telegram");
const time = require("./time");
const misc = require("./misc");

module.exports = {
  ...misc,
  telegram,
  time,
};
