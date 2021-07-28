import { EditMessageTextOptions, InlineKeyboardButton } from "node-telegram-bot-api";
import * as rawWheel from "../../data/emotionWheel.json";
import { prevCommand } from "../db/users";
import { EMOTIONS, EmotionsPartial, Selection } from "../types/continueConversation";
import { groupPairs, withInlineKeyboard } from "./telegram";

type EditMessage = (message: string, keyboard?: EditMessageTextOptions) => void;

// CONSTANTS

const wheel = rawWheel as Selection;
export const WHEEL_IMAGE = "AgACAgUAAx0CWYt3XAACA3lg_NYQ_GrwSnxWs5Zx-JEHtycvAgACeK0xGy0l6VdgFrA19a6Q0wEAAwIAA3kAAyAE";

export const EMPTY_PATH = "";
export const EMPTY_SELECTION: Selection = {};

export const BACK = "back";
const BACK_BUTTON = { text: "◀️ Back", callback_data: `${EMOTIONS} - ${BACK}` };
export const CANCEL = "cancel";
const CANCEL_BUTTON = { text: "❌ Cancel", callback_data: `${EMOTIONS} - ${CANCEL}`};
export const DONE = "done";
const DONE_BUTTON = { text: "✅ Done", callback_data: `${EMOTIONS} - ${DONE}` };

export const INTRO_TEXT = "*🎡 Emotion Wheel*\n\nUse the keyboard provided to navigate the emotion wheel and select emotions that resonate with you.";
const GO_AGAIN = "Use /emotion_wheel to try again.";

// UTILITIES

export const updatePartial = async (
  chatId: number,
  path: string,
  selection: Selection
): Promise<void> => {
  prevCommand.set(chatId, EMOTIONS, { path, selection });
};

export const getPartial = async (chatId: number): Promise<EmotionsPartial> => {
  const { command, partial } = await prevCommand.get(chatId);
  const result = command === EMOTIONS ? partial : null;
  return result as EmotionsPartial;
};

const emotionIsSelected = (selection: Selection, l1: string, l2: string, l3: string) => {
  return selection[l1] && selection[l1][l2] && selection[l1][l2].includes(l3);
};

const getControlButton = (selection: Selection) => {
  return Object.keys(selection).length > 0 ? DONE_BUTTON : CANCEL_BUTTON;
};

export const getKeyboard = (path: string, selection: Selection): InlineKeyboardButton[][] => {
  const CONTROL_BUTTON = getControlButton(selection);
  if (path === "") { // L0
    const rawKeys = Object.keys(wheel).map(l1 => ({
      text: l1,
      callback_data: `${EMOTIONS} - ${l1}`,
    }));
    return groupPairs(rawKeys).concat([[CONTROL_BUTTON]]);
  }
  const split = path.split(" - ");
  if (split.length === 1) { // L1
    const l1 = split[0];
    const rawKeys = Object.keys(wheel[l1]).map(l2 => ({
      text: l2,
      callback_data: `${EMOTIONS} - ${split[0]} - ${l2}`,
    }));
    return groupPairs(rawKeys).concat([[BACK_BUTTON, CONTROL_BUTTON]]);
  } else if (split.length === 2) { // L2
    const [l1, l2] = split;
    const rawKeys = wheel[l1][l2].map(l3 => ({
      text: emotionIsSelected(selection, l1, l2, l3) ? `✔️ ${l3}` : l3,
      callback_data: `${EMOTIONS} - ${l1} - ${l2} - ${l3}`,
    }));
    return groupPairs(rawKeys).concat([[BACK_BUTTON, CONTROL_BUTTON]]);
  }
};

// FORMATTING

const format = (selection: Selection): string => {
  const l1s = Object.keys(selection);
  if (l1s.length === 0) return "Emotions you've selected using the keyboard will show up here.";
  return l1s.map(l1 => {
    const l2s = Object.keys(selection[l1]);
    const children = l2s.map(l2 => {
      const l3s = selection[l1][l2];
      return `- ${l2}: ${l3s.join(", ")}`;
    }).join("\n");
    return `${l1}\n${children}`;
  })
  .join("\n\n");
};

const getMessage = (path: string, selection: Selection): string => {
  return [
    INTRO_TEXT,
    format(selection),
    `Current path: ${path.replace(/-/g, ">")}`,
  ].join("\n\n");
};

const getDoneMessage = (selection: Selection) => {
  if (Object.keys(selection).length > 0) {
    return [
      "*🎡 Emotion Wheel*",
      "Good job! Using the emotion wheel, you've identified that you're feeling these emotions:",
      format(selection),
      GO_AGAIN,
    ].join("\n\n");
  }
  return [INTRO_TEXT, GO_AGAIN].join("\n\n");
};

// ACTIONS

export const updatePath = async (
  editMessage: EditMessage,
  chatId: number,
  path: string,
  selection: Selection
): Promise<void> => {
  updatePartial(chatId, path, selection);

  const message = getMessage(path, selection);
  const keyboard = withInlineKeyboard(getKeyboard(path, selection)) as EditMessageTextOptions;
  editMessage(message, keyboard);
};

export const toggleEmotion = (
  editMessage: EditMessage,
  chatId: number,
  path: string,
  selection: Selection,
  pathToEmotion: string
): void => {
  const [l1, l2, l3] = pathToEmotion.split(" - ");
  if (!selection[l1]) {
    selection[l1] = { [l2]: [l3] };
  } else if (!selection[l1][l2]) {
    selection[l1][l2] = [l3];
  } else if (!selection[l1][l2].includes(l3)) {
    selection[l1][l2].push(l3);
  } else {
    selection[l1][l2] = selection[l1][l2].filter(x => x !== l3);
    if (selection[l1][l2].length === 0) {
      delete selection[l1][l2];
      if (Object.keys(selection[l1]).length === 0) {
        delete selection[l1];
      }
    }
  }
  updatePartial(chatId, path, selection);
  const message = getMessage(path, selection);
  const keyboard = withInlineKeyboard(getKeyboard(path, selection)) as EditMessageTextOptions;
  editMessage(message, keyboard);
};

export const done = (
  editMessage: EditMessage,
  chatId: number,
  selection: Selection
): void => {
  editMessage(getDoneMessage(selection));
  prevCommand.reset(chatId);
};
