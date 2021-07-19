import { Emoji } from "./entities";

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
