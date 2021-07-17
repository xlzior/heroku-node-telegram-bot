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
  end_id: number,
  name: string,
  hashtags?: string[],
}

export type Quest = {
  id: number,
  name: string,
  questions: string[],
}
