const intro = [
  "Welcome to LifeXP, a gamified journalling chatbot.",
  "I'm here to help you pen down your thoughts in a safe and convenient environment.",
].join("\n");

const journal = [
  "*Journal*",
  "/open - start a new journal entry",
  "/prompt - get a randomised prompt",
  "/echo - give yourself a prompt",
  "/ididathing - celebrate something you're proud of",
  "/close - end off the journal entry",
].join("\n");

const browse = [
  "*Browse*",
  "/reflections - list all reflections",
  "/hashtags - list all hashtags",
  "/hashtag - browse reflections with a particular hashtag",
].join("\n");

const game = [
  "*Game Features*",
  "/lifexp - show level and XP",
  "/achievements - show display cabinet of achievement badges",
  "/stats - show statistics",
].join("\n");

const scheduled = [
  "*Scheduled Journalling Sessions*",
  "/manage_schedules",
  "/add_schedule",
  "/edit_schedule",
  "/delete_schedule",
].join("\n");

const bedtime = [
  "*Bedtime*",
  "/set_bedtime",
  "/good_morning",
  "/good_night",
].join("\n");

const misc = [
  "/cancel - cancel your previous command",
].join("\n");

const outro = [
  "I hope you have a meaningful journalling session. 😊",
].join("\n");

module.exports = [intro, journal, browse, game, scheduled, bedtime, misc, outro];
