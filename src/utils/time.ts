import { DateTime } from "luxon";
import { handlePlural } from "./misc";

export const parseTime = (timeString, zone = "UTC") => DateTime.fromFormat(timeString, "ha", { zone });

export const validateTime = rawText => parseTime(rawText).isValid && rawText;

export const formatTime = timeObj => timeObj.toFormat("ha");

export const generateDateTime = zone => DateTime.now().setZone(zone).toFormat("yyyy/MM/dd ha");

export const localToUTC = (localTimeString, localTimeZone) => {
  const parsed = parseTime(localTimeString, localTimeZone);
  return formatTime(parsed.toUTC());
};

export const utcToLocal = (utcTimeString, localTimeZone) => {
  const parsed = parseTime(utcTimeString);
  return formatTime(parsed.setZone(localTimeZone));
};

export const utcToLocal24 = (utcTimeString, localTimeZone) => {
  const parsed = parseTime(utcTimeString);
  return parsed.setZone(localTimeZone).hour;
};

export const formatScheduleInfo = (time, questions) => {
  const numberOfPrompts = handlePlural("prompt", "prompts");
  return [
    `${time} with the following ${numberOfPrompts(questions.length)}:`,
    questions.join("\n"),
  ].join("\n");
};
