import { DateTime, FixedOffsetZone, Zone } from "luxon";
import { handlePlural } from "./misc";

export const parseTime = (
  timeString: string,
  zone = FixedOffsetZone.utcInstance
): DateTime => {
  return DateTime.fromFormat(timeString, "ha", { zone });
};

export const validateTime = (rawText: string) => {
  return parseTime(rawText).isValid && rawText;
};

export const formatTime = (timeObj: DateTime): string => timeObj.toFormat("ha");

export const generateDateTime = (zone: Zone): string => {
  return DateTime.now().setZone(zone).toFormat("yyyy/MM/dd ha");
};

export const localToUTC = (
  localTimeString: string,
  localTimeZone: Zone
): string => {
  const parsed = parseTime(localTimeString, localTimeZone);
  return formatTime(parsed.toUTC());
};

export const utcToLocal = (
  utcTimeString: string,
  localTimeZone: Zone
): string => {
  const parsed = parseTime(utcTimeString);
  return formatTime(parsed.setZone(localTimeZone));
};

export const utcToLocal24 = (
  utcTimeString: string,
  localTimeZone: Zone
): number => {
  const parsed = parseTime(utcTimeString);
  return parsed.setZone(localTimeZone).hour;
};

export const formatScheduleInfo = (
  time: string,
  questions: string[]
): string => {
  const numberOfPrompts = handlePlural("prompt", "prompts");
  return [
    `${time} with the following ${numberOfPrompts(questions.length)}:`,
    questions.join("\n"),
  ].join("\n");
};
