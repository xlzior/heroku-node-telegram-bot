const xpPerLevel = [ 0, // 0-indexing =/
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

const rollingSum = [];
rollingSum[0] = xpPerLevel[0];
xpPerLevel.forEach((xpNeeded, index) => {
  if (index === 0) return;
  rollingSum[index] = rollingSum[index - 1] + xpNeeded;
})

const xpForNextLevel = currentLevel => {
  if (currentLevel < 20) return xpPerLevel[currentLevel];
  return 0;
};

const xpBaseForLevel = currentLevel => {
  const previousLevel = currentLevel - 1;
  if (currentLevel < 20) return rollingSum[previousLevel];
  return rollingSum[19];
}

const FILLED_BAR = "█"
const EMPTY_BAR = "▁"
const PROGRESS_BAR_LENGTH = 16;
// xp is cumulative, over all levels
const formatLevel = (level, xp) => {
  const levelDisplay = `Level ${level}`
  const xpBase = xpBaseForLevel(level);
  const xpNeeded = xpForNextLevel(level);

  const numerator = xp - xpBase; // display non-cumulative
  const denominator = xpNeeded;
  const percentageFilled = numerator / denominator;
  const filled = Math.floor(percentageFilled * PROGRESS_BAR_LENGTH);
  const empty = PROGRESS_BAR_LENGTH - filled;
  const progressBar = `${FILLED_BAR.repeat(filled)}${EMPTY_BAR.repeat(empty)}`;

  return `${levelDisplay}    ${progressBar}    ${numerator}/${denominator}`
};

const incrementXP = (level, originalXP, additionalXP) => {
  const xpThreshold = xpBaseForLevel(level + 1);
  const newXP = originalXP + additionalXP;
  const levelledUp = newXP >= xpThreshold;
  return {
    newXP,
    newLevel: levelledUp ? level + 1 : level,
    levelledUp,
  }
}

module.exports = {
  formatLevel,
  incrementXP,
}