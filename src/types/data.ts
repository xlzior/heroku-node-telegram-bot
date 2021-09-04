import { Emoji } from "./entities";

export type XPData = {
  xp: number,
  level: number,
  levelledUp: boolean,
}

export type ProgressData = {
  xp: number,
  level: number,
  levelledUp: boolean,
  pinnedMessageId: number,
  streak: number,
  additionalXP: number,
}

export type Progress = {
  level: number,
  xp: number,
  streak: number,
  pinned_message_id: number,
}

export type Statistics = {
  progress: Progress,
  idat: number,
  reflections: {
    count: number,
    length: {
      total: number,
      average: number,
      maximum: number
    }
  }
  hashtags: {
    total: number,
    unique: number
  },
  emojis: Emoji[]
}

type ResourceType = "yoga" | "meditation" | "article" | "exercise";

export type Resource = {
  type: ResourceType,
  text: string
}
