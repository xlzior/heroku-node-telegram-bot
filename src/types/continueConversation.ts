import Bot = require("node-telegram-bot-api");
import MyTelegramBot from "../bot/TelegramBot";

export type Shortcuts = {
  userId: number,
  chatId: number,
  send: (text: string, options?: Record<string, unknown>) => Promise<Bot.Message>
}

export type QuestPartial = {
  questId: number,
  index: number,
}

export type QuestPrevCommand = {
  command: "QUESTS",
  partial: QuestPartial,
}

export type ScheduledPartial = {
  time: string,
  index: number,
}

export type ScheduledPrevCommand = {
  command: "SCHEDULED",
  partial: ScheduledPartial,
}

export type Partial = QuestPartial | ScheduledPartial;
export type PrevCommand = QuestPrevCommand | ScheduledPrevCommand;

export type ContinueConversationHandler = (
  shortcuts: Shortcuts,
  msg: Bot.Message,
  partial: Partial,
) => void;

export type HandlerArguments = {
  bot: MyTelegramBot,
  continueConversation: Record<string, ContinueConversationHandler>,
}
