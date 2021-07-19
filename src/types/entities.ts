export type Emoji = {
  emoji: string,
  count: number,
}

export type Hashtag = {
  hashtag: string,
  count: number,
}

export type Reflection = {
  start_id: number,
  name: string,
  end_id?: number,
  hashtags?: string[],
}

export type Quest = {
  id: number,
  name: string,
  questions: string[],
}

export type Achievement = {
  user_id: number,
  type: string,
  level: number,
}

export type ScheduleQuestions = string[];

export type Schedule = {
  time: string,
  questions: ScheduleQuestions,
}
