const intro = [
  "Welcome to LifeXP, a gamified journalling chatbot.",
  "I'm here to help you pen down your thoughts in a safe and convenient environment.",
].join("\n");

const journal = [
  "📝 *Journal*",
  "/open - open a new journal entry",
  "/prompt - get a randomised prompt",
  "/echo - give yourself a prompt",
  "/ididathing - celebrate something you're proud of",
  "/close - close journal entry",
].join("\n");

const browse = [
  "📖 *Browse*",
  "/reflections - browse reflections",
  "/hashtags - browse hashtags",
  "/hashtag - browse reflections by hashtag",
].join("\n");

const game = [
  "🎮 *Game Features*",
  "/lifexp - show level and XP",
  "/achievements - show display cabinet of achievement badges",
  "/stats - show statistics",
].join("\n");

const quests = [
  "⚔️ *Quests*",
  "/quests - browse quests",
].join("\n");

const scheduled = [
  "⏰ *Scheduled Journalling Sessions*",
  "/manage_schedules",
  "/add_schedule",
  "/edit_schedule",
  "/delete_schedule",
].join("\n");

const bedtime = [
  "🛌 *Bedtime*",
  "/set_bedtime - set bedtime goals",
  "/good_morning - claim XP for waking up on time",
  "/good_night - claim XP for going to sleep on time",
].join("\n");

const misc = [
  "/cancel - cancel your previous command",
].join("\n");

const outro = [
  "I hope you have a meaningful journalling session. 😊",
].join("\n");

export default [intro, journal, browse, game, quests, scheduled, bedtime, misc, outro];
