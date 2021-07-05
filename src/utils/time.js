const { DateTime } = require("luxon");
const { handlePlural } = require("./misc");

const parseTime = (timeString, zone) => DateTime.fromFormat(timeString, "ha", { zone });
const validateTime = rawText => parseTime(rawText).invalid ? false : rawText;
const formatTime = timeObj => timeObj.toFormat("ha");
const generateDateTime = zone => DateTime.now().setZone(zone).toFormat("yyyy/MM/dd ha");
const localToUTC = (localTimeString, localTimeZone) => {
  const parsed = parseTime(localTimeString, localTimeZone);
  return formatTime(parsed.toUTC());
};
const utcToLocal = (utcTimeString, localTimeZone) => {
  const parsed = parseTime(utcTimeString, "UTC");
  return formatTime(parsed.setZone(localTimeZone));
};
const utcToLocal24 = (utcTimeString, localTimeZone) => {
  const parsed = parseTime(utcTimeString, "UTC");
  return parsed.setZone(localTimeZone).hour;
};

const formatScheduleInfo = (time, questions) => {
  const numberOfPrompts = handlePlural("prompt", "prompts");
  return [
    `${time} with the following ${numberOfPrompts(questions.length)}:`,
    questions.join("\n"),
  ].join("\n");
};

module.exports = {
  validateTime,
  formatTime,
  generateDateTime,
  formatScheduleInfo,
  localToUTC,
  utcToLocal,
  utcToLocal24,
};
