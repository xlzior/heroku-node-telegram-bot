import { KeyboardButton } from "node-telegram-bot-api";
import { reflections, users } from "../db";
import { REFLECTION_ALREADY_OPEN } from "../db/errors";
import { ALTERNATIVE, AUTOMATIC, CBT, CbtPartial, DISTORTION, HandlerArguments, TRIGGER } from "../types/continueConversation";
import { clean, FORCE_REPLY, MARKDOWN, REMOVE_KEYBOARD, withKeyboard } from "../utils/telegram";

const CBT_EXPLAINER = "AgACAgUAAx0CWYt3XAACBi9hMwquuO2gU8JE6PmfxL2VvT4ICwACBK0xG-admFUiT58GwUkS3gEAAwIAA3kAAyAE";
const UNHELPFUL_THINKING_STYLES = "AgACAgUAAx0CWYt3XAACBiNhMwR_Ka2B9SGoBCMkYiNHdFv9zgAC_KwxG-admFUL_2CcJ0u9fgEAAwIAA3kAAyAE";
const AUTOMATIC_THOUGHTS = "AgACAgUAAx0CWYt3XAACB2hhMyRwvr24iDBe9qodZZVQuOa_TQACYK0xG8zWmFVYjZONELFkUAEAAwIAA3kAAyAE";

const YES_NO_KEYBOARD: KeyboardButton[][] = [[{ text: "Yes" }, { text: "No" }]];

const generateTriggerText = () => {
  const questions = [
    "What events or triggers occurred leading up to your 'problem'?",
    "What emotions are you feeling now, and why do you think you feel this way?",
    "What habit are you trying to change, and why do you feel this way about it?",
  ];
  const index = Math.floor(Math.random() * questions.length);
  return `*Identifying the trigger*\n\n${questions[index]}\n\n✅ /done`;
};

async function startTriggerStage({ send, chatId }, msg) {
  try {
    await reflections.open(chatId, msg.message_id);
    await send(clean(generateTriggerText()), { ...MARKDOWN, ...REMOVE_KEYBOARD });
    users.prevCommand.set(chatId, CBT, { stage: TRIGGER, isFirst: true });
  } catch (error) {
    if (error === REFLECTION_ALREADY_OPEN) {
      return send("You already have a reflection open. Please /close the reflection before starting the CBT activity.");
    }
  }
}

async function startAutomaticStage({ send, chatId }, isFirst = false) {
  await send(clean("*Identifying automatic thought(s)*\n\nIn response to your 'problem', what are the immediate thoughts you have about the situation or about yourself?\n\nClick /automatic_thoughts to find out more.\n\n✅ /done"), { ...MARKDOWN, ...REMOVE_KEYBOARD });
  users.prevCommand.set(chatId, CBT, { stage: AUTOMATIC, isFirst });
}

async function startDistortionStage({ send, chatId }, bot, isFirst = false) {
  if (isFirst) await bot.sendPhoto(chatId, UNHELPFUL_THINKING_STYLES);
  await send("Try to identify the cognitive distortion(s) that you might be using now.\n\n✅ /done");
  users.prevCommand.set(chatId, CBT, { stage: DISTORTION });
}

async function startAlternativeStage({ send, chatId }) {
  await send(clean("*Assigning a replacement thought*\n\nCreate a replacement thought for the automatic thought you just wrote down."), MARKDOWN);
  await send(clean(`You can try:
• Writing the opposite of your negative thought.
• Asking yourself if your unproductive thought is only partly true or incomplete. What could you tell yourself to get a complete and realistic picture of your situation?
• Think about what others have complimented you on, or another time you have overcome a similar issue before.
• Imagine yourself as giving advice to a friend with a similar problem as you.

✅ /done
  `), MARKDOWN);
  users.prevCommand.set(chatId, CBT, { stage: ALTERNATIVE });
}

export default function handleCbt({ bot, continueConversation }: HandlerArguments): void {
  bot.handle(/\/cbt/, async ({ send, chatId }) => {
    await send(clean("*Cognitive Behavioural Therapy (CBT)* helps you deal with the automatic, emotion-filled thoughts and negative thinking patterns. Ordinarily, CBT is conducted with a counsellor in 1 hour sessions on a weekly or bi-weekly basis, for 5-6 months. While you should still seek help from a mental health professional if you need to, LifeXP can help you practice the techniques of CBT on your own, yet in a structured manner."), MARKDOWN);

    await send("Use this function when you observe an unhealthy thinking pattern about yourself, or encounter a problem or difficult situation that makes you emotional.\n\nThis session might take at least 20 mins. Find a comfortable space to sit and reflect.");

    await send("Do you need an explainer on CBT?", withKeyboard(YES_NO_KEYBOARD));
    users.prevCommand.set(chatId, "cbt - explainer");
  });

  continueConversation["cbt - explainer"] = async ({ send, chatId }, msg) => {
    if (msg.text === "Yes") {
      await bot.sendPhoto(chatId, CBT_EXPLAINER, { caption: "Adapted from [Mind, the mental health charity](https://www.youtube.com/channel/UCarWBJYMNqJxgn6n8_htCTQ) Youtube channel", parse_mode: "MarkdownV2" });

      await send("Your thoughts, feelings and behaviours are all connected to each other. What you think about a certain experience will affect how you feel about it and about similar events in the future. Your feelings will then shape how you behave or act when faced in a similar situation. Often, there is a trigger either in the present day or the past that shapes your first, and subsequent automatic thoughts about a certain event.\n\nIf you are feeling negative emotions or have behavioural patterns you want to change, CBT can help you identify and replace negative automatic thoughts you might have.", REMOVE_KEYBOARD);

      await send("Need an example? Watch this 3 minute video on CBT: https://www.youtube.com/watch?v=9c_Bv_FBE-c");

      await send("Ready for your session?", withKeyboard(YES_NO_KEYBOARD));
      users.prevCommand.set(chatId, "cbt - ready");
    } else {
      startTriggerStage({ send, chatId }, msg);
    }
  };

  continueConversation["cbt - ready"] = ({ send, chatId }, msg) => {
    if (msg.text === "Yes") {
      startTriggerStage({ send, chatId }, msg);
    } else {
      send("Alright, sure thing. If you would like to try out CBT in future again, simply send /cbt.");
    }
  };

  bot.handle(/\/automatic_thoughts/, async ({ send, chatId }) => {
    await bot.sendPhoto(chatId, AUTOMATIC_THOUGHTS);
    await send(clean("*Automatic Thoughts*\nthoughts that are instantaneous, habitual, and nonconscious.\n\nAutomatic thoughts affect a person’s mood and actions. Some automatic thoughts are negative, and only partially true, yet they may already be repeated subconsciously. Recognise these automatic thoughts, and assign a healthier, more accurate automatic thought."), MARKDOWN);
  });

  bot.handle(/\/done/, async shortcuts => {
    const { command, partial } = await users.prevCommand.get(shortcuts.chatId);
    if (command !== CBT) return;

    const { stage, isFirst } = partial as CbtPartial;
    switch (stage) {
      case TRIGGER:
        return startAutomaticStage(shortcuts, isFirst);
      case AUTOMATIC:
        return startDistortionStage(shortcuts, bot, isFirst);
      case DISTORTION:
        return startAlternativeStage(shortcuts);
      case ALTERNATIVE:
        shortcuts.send("Do you have any more automatic thoughts you would like to reflect about?", withKeyboard(YES_NO_KEYBOARD));
        return users.prevCommand.set(shortcuts.chatId, "cbt - continue automatic");
      default:
        break;
    }
  });

  continueConversation["cbt - continue automatic"] = async (shortcuts, msg) => {
    if (msg.text === "Yes") {
      startAutomaticStage(shortcuts);
    } else {
      shortcuts.send("Alright, closing this session. How would you like to name this reflection for future browsing?", FORCE_REPLY);
      users.prevCommand.set(shortcuts.chatId, "cbt - close");
    }
  };

  continueConversation["cbt - close"] = async (shortcuts, msg) => {
    const botMsg = await shortcuts.send("Congratulations! You are one step closer to overcoming your 'problem'! Proud of you <3");
    await bot.sendClosingStats(shortcuts, botMsg.message_id, msg.text, msg.date);
    await users.prevCommand.reset(shortcuts.chatId);
  };
}
