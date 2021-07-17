// const BADGE_LEVEL_LABELS = ["", "Bronze", "Silver", "Gold"];
const BADGE_LEVEL_EMOJIS = ["", "🥉", "🥈", "🥇"];

export const BLANK_BADGE = "AgACAgUAAxkBAAIGB2DA0i_hf0S1ngYqmqp-f-pW7as5AALsrjEbEjMAAVYAAWO6j_uMthMYaJVydAADAQADAgADeAADilAAAh8E";

const BADGES = {
  reflections: {
    values: [0, 3, 10, 50],
    name: "📝 Pour Your Heart Out",
    images: [
      "",
      "AgACAgUAAxkBAAIETGC-NGhGJpWEWsF0Xp-hp5QWwVG4AALKrzEbfrvxVcSP6k35Ak02nKaucHQAAwEAAwIAA3gAA6N6AgABHwQ",
      "AgACAgUAAxkBAAIETWC-NGga3vGrpsOL8fgL095Xu6MYAALLrzEbfrvxVantXaXCSAZisbgVb3QAAwEAAwIAA3gAA99KBQABHwQ",
      "AgACAgUAAxkBAAIETmC-NGjS8O_qnRh2wA5SGNLcffNaAALMrzEbfrvxVSMbniIEU6_bx3S3b3QAAwEAAwIAA3gAA01PBQABHwQ",
    ],
  },
  convoLength: {
    values: [0, 30, 100, 500],
    name: "🕳 Going Deep",
    images: [
      "",
      "AgACAgUAAxkBAAIESWC-NFYcgawePCVkFfamIkf09wABMAACx68xG3678VWz9Zij_xVaPVCFfnJ0AAMBAAMCAAN4AAM1RwACHwQ",
      "AgACAgUAAxkBAAIESmC-NFbTOo5uVWVGUxxWaMccmTWMAALIrzEbfrvxVT_HxJR37lJAC1uScnQAAwEAAwIAA3gAA1pEAAIfBA",
      "AgACAgUAAxkBAAIES2C-NFYhfCPC3cSkQoTalPmBT0GUAALJrzEbfrvxVR3gqelXd-DoYLyObHQAAwEAAwIAA3gAAyEMCAABHwQ",
    ],
  },
  emojis: {
    values: [0, 3, 10, 50],
    name: "😭 The Emotional One",
    images: [
      "",
      "AgACAgUAAxkBAAIERmC-NEIqRYYEQXPvikHPNT6JNBqlAALErzEbfrvxVbKUlt5z-4VFFLUyb3QAAwEAAwIAA3gAA_r1BAABHwQ",
      "AgACAgUAAxkBAAIER2C-NELEnzQAAf_DS6TMxhzMtbjPDAACxa8xG3678VVPSPSMXTViakwM7m50AAMBAAMCAAN4AAPVLQUAAR8E",
      "AgACAgUAAxkBAAIESGC-NEL1dE-bN_P06bF6u2I6u_QpAALGrzEbfrvxVXT324rcNqoGiCelb3QAAwEAAwIAA3gAAxvzBAABHwQ",
    ],
  },
  hashtags: {
    values: [0, 3, 10, 50],
    name: "#️⃣ The Categoriser",
    images: [
      "",
      "AgACAgUAAxkBAAIEQ2C-NChYmDeYDQe9zEmzJGkZaohwAALArzEbfrvxVZHUbrI0Dc2Ltf6PdHQAAwEAAwIAA3gAA6nSAAIfBA",
      "AgACAgUAAxkBAAIERGC-NCgSvuyGHBPdywW_uqbrQT0kAALBrzEbfrvxVfW_152-ngI9IkCpcnQAAwEAAwIAA3gAAyxHAAIfBA",
      "AgACAgUAAxkBAAIERWC-NCjvJsDGsgMkyWP8ku_hMGMsAALCrzEbfrvxVb_0j0scG3ohYZPGc3QAAwEAAwIAA3gAA2dUAgABHwQ",
    ],
  },
  idat: {
    values: [0, 3, 10, 50],
    name: "💪 Doer of Great Things",
    images: [
      "",
      "AgACAgUAAxkBAAIEQGC-NASqoak-Zir2odGHY1l6g0hmAAK7rzEbfrvxVZL5sc_JjV0fPqdyc3QAAwEAAwIAA3gAA8dVAgABHwQ",
      "AgACAgUAAxkBAAIEQWC-NATeGqtrirr0UxO14nU256-uAAK8rzEbfrvxVQ8YTGBhLMWu-9OtcnQAAwEAAwIAA3gAAwFKAAIfBA",
      "AgACAgUAAxkBAAIEQmC-NAR8fSPTa6Zr5Ec-Bcsar80vAAK9rzEbfrvxVSAwYteCgwF6z8eNcnQAAwEAAwIAA3gAA-ZLAAIfBA",
    ],
  },
};

// return the index of the largest item in badgeValues that is <= value
const getBadgeLevel = (badgeValues: number[], value: number) => {
  for (let i = badgeValues.length - 1; i >= 0; i--) {
    if (value >= badgeValues[i]) return i;
  }
};

type NewBadgeData = {
  hasNewBadge: boolean,
  previousLevel: number,
  currentLevel: number,
}

export const checkForNewBadge = (
  type: string,
  previousLevel = 0,
  value: number
): NewBadgeData => {
  const currentLevel = getBadgeLevel(BADGES[type].values, value);
  return {
    hasNewBadge: currentLevel > previousLevel,
    previousLevel,
    currentLevel,
  };
};

export const getBadgeImage = (type: string, badgeLevel: number): string => {
  return BADGES[type].images[badgeLevel];
};

export const getBadgeLabel = (type: string, badgeLevel: number): string => {
  return `${BADGES[type].name} ${BADGE_LEVEL_EMOJIS[badgeLevel]}`;
};
