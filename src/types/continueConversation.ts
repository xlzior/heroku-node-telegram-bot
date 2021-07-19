import Bot = require("node-telegram-bot-api");
import MyTelegramBot from "../bot/TelegramBot";

export type Shortcuts = {
  userId: number,
  chatId: number,
  send: (text: string, options?: Bot.SendMessageOptions) => Promise<Bot.Message>
}

/* Previous commands and partials */

export const EMPTY = "";
type EmptyPartial = Record<string, never>;
type EmptyPrevCommand = { command: "", partial: EmptyPartial };

// reflections
export const OPEN_REFLECTION = "open reflection";
type OpenReflectionPrevCommand = { command: "open reflection", partial: EmptyPartial }

export const CLOSE_REFLECTION = "close reflection";
type CloseReflectionPrevCommand = { command: "close reflection", partial: EmptyPartial }

// IDAT
export const IDAT_WHAT = "idat - what";
type IdatWhatPrevCommand = { command: "idat - what", partial: EmptyPartial };
export const IDAT_FEELING = "idat - feeling";
type IdatFeelingPrevCommand = { command: "idat - feeling", partial: EmptyPartial };
export const IDAT_DIFFICULTY = "idat - difficulty";
type IdatDifficultyPrevCommand = { command: "idat - difficulty", partial: EmptyPartial };

// quests
export const QUESTS = "quests";
export type QuestPartial = { questId: number, index: number };
type QuestPrevCommand = { command: "quests", partial: QuestPartial };

// browse
export const HASHTAG = "hashtag";
type HashtagPrevCommand = { command: "hashtag", partial: EmptyPartial };

export const SET_TIMEZONE = "set timezone";
type SetTimezonePrevCommand = { command: "set timezone", partial: EmptyPartial };

// bedtime
export const BEDTIME = "set bedtime";
type BedtimePrevCommand = { command: "set bedtime", partial: EmptyPartial }

export const WAKEUP = "set wakeup time";
export type WakeupPartial = { bedtime: string };
type WakeupPrevCommand = { command: "set wakeup time", partial: WakeupPartial }

// scheduled
export const SCHEDULED = "scheduled";
export type ScheduledPartial = { time: string, index: number };
type ScheduledPrevCommand = { command: "scheduled", partial: ScheduledPartial };

export const ADD_TIME = "schedule - add - time";
export type AddTimePartial = { tz: string };
type AddTimePrevCommand = { command: "schedule - add - time", partial: AddTimePartial };

export const ADD_QUESTIONS = "schedule - add - questions";
export type AddQuestionsPartial = { tz: string, time: string };
type AddQuestionsPrevCommand = { command: "schedule - add - time", partial: AddQuestionsPartial };

export const EDIT_SELECT = "schedule - edit - select";
export type EditSelectPartial = { tz: string };
type EditSelectPrevCommand = { command: "schedule - edit - select", partial: EditSelectPartial };

export const EDIT_TIME = "schedule - edit - time";
export type EditTimePartial = { tz: string, time: string };
type EditTimePrevCommand = { command: "schedule - edit - time", partial: EditTimePartial };

export const EDIT_QUESTIONS = "schedule - edit - questions";
export type EditQuestionsPartial = { tz: string, time: string, newTime: string };
type EditQuestionsPrevCommand = { command: "schedule - edit - questions", partial: EditQuestionsPartial };

export const DELETE_SELECT = "schedule - delete - select";
export type DeleteSelectPartial = { tz: string };
type DeleteSelectPrevCommand = { command: "schedule - delete - select", partial: DeleteSelectPartial };

export const DELETE_CONFIRM = "schedule - delete - confirm";
export type DeleteConfirmPartial = { tz: string, time: string };
type DeleteConfirmPrevCommand = { command: "schedule - delete - confirm", partial: DeleteConfirmPartial };

export type PrevCommand = EmptyPrevCommand |
  OpenReflectionPrevCommand |
  CloseReflectionPrevCommand |
  IdatWhatPrevCommand |
  IdatFeelingPrevCommand |
  IdatDifficultyPrevCommand |
  HashtagPrevCommand |
  QuestPrevCommand |
  BedtimePrevCommand |
  WakeupPrevCommand |
  ScheduledPrevCommand |
  AddTimePrevCommand |
  AddQuestionsPrevCommand |
  SetTimezonePrevCommand |
  EditSelectPrevCommand |
  EditTimePrevCommand |
  EditQuestionsPrevCommand |
  DeleteSelectPrevCommand |
  DeleteConfirmPrevCommand;

export type ContinueConversationHandler = (
  shortcuts: Shortcuts,
  msg: Bot.Message,
  partial: PrevCommand["partial"],
) => void;

export type HandlerArguments = {
  bot: MyTelegramBot,
  continueConversation: Record<string, ContinueConversationHandler>,
}
