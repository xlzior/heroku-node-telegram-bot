const XP_PER_LEVEL = [ 0, // 0-indexing =/
  500,  // 1 -> 2
  1000,
  1500,
  2000,
  3000,
  4000,
  5000,
  6000,
  7000, // 9 -> 10
  9000,
  11000,
  13000,
  15000,
  17000,
  21000,
  25000,
  29000,
  33000,
  37000, // 19 -> 20
];

const MAX_LEVEL = XP_PER_LEVEL.length;

const ROLLING_SUM = []; // base XP for each level
ROLLING_SUM[0] = XP_PER_LEVEL[0];
XP_PER_LEVEL.forEach((xpNeeded, index) => {
  if (index === 0) return;
  ROLLING_SUM[index] = ROLLING_SUM[index - 1] + xpNeeded;
})

const xpForNextLevel = currentLevel => {
  if (currentLevel < MAX_LEVEL) return XP_PER_LEVEL[currentLevel];
  return 0;
};

const xpBaseForLevel = currentLevel => {
  if (currentLevel < MAX_LEVEL) return ROLLING_SUM[currentLevel - 1];
  return ROLLING_SUM[MAX_LEVEL - 1];
}

const FILLED_BAR = "█"
const EMPTY_BAR = "▁"
const PROGRESS_BAR_LENGTH = 10;
const generateProgressBar = (percentageFilled, length) => {
  const filled = Math.floor(percentageFilled * length);
  const empty = length - filled;
  return `${FILLED_BAR.repeat(filled)}${EMPTY_BAR.repeat(empty)}`;
}

// xp is cumulative, over all levels
const formatLevel = (level, xp) => {
  const levelDisplay = `Level ${level}`
  if (level < MAX_LEVEL) {
    const numer = xp - xpBaseForLevel(level); // display non-cumulative so progress bar is intuitive
    const denom = xpForNextLevel(level);
    const progressBar = generateProgressBar(numer / denom, PROGRESS_BAR_LENGTH);
    return `${levelDisplay}    ${progressBar}    ${numer}/${denom}`
  }

  // max level reached
  const progressBar = generateProgressBar(1, PROGRESS_BAR_LENGTH);
  return `${levelDisplay} (MAX)    ${progressBar}    ${xp} XP`;
};

const incrementXP = (level, originalXP, additionalXP) => {
  const xpThreshold = xpBaseForLevel(level + 1);
  const newXP = originalXP + additionalXP;
  const levelledUp = newXP >= xpThreshold;
  if (level < MAX_LEVEL) {
    return {
      newXP,
      newLevel: levelledUp ? level + 1 : level,
      levelledUp,
    }
  }

  // max level reached
  return { newXP, newLevel: level, levelledUp: false };
}

module.exports = {
  formatLevel,
  incrementXP,
}