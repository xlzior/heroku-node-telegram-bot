CREATE TABLE users(
  user_id BIGINT PRIMARY KEY,
  level INTEGER,
  xp INTEGER,
  pinned_message_id INTEGER,
  idat INTEGER,
  current_reflection_id INTEGER,
  prev_command VARCHAR,
  partial JSONB,
  tz VARCHAR,
  bedtime TIME,
  wakeup_time TIME,
  streak INTEGER,
  last_reflection_date VARCHAR -- stored as a string in yyyy-MM-dd format, to be interpreted as timezone tz
);

CREATE TABLE reflections(
  user_id BIGINT,
  start_id INTEGER,
  end_id INTEGER,
  name VARCHAR,
  PRIMARY KEY(user_id, start_id),
  CONSTRAINT foreign_key_user
    FOREIGN KEY(user_id)
      REFERENCES users(user_id)
);

CREATE TABLE achievements(
  user_id BIGINT,
  type VARCHAR,
  level SMALLINT,
  PRIMARY KEY(user_id, type),
  CONSTRAINT foreign_key_user
    FOREIGN KEY(user_id)
      REFERENCES users(user_id)
);

CREATE TABLE hashtags(
  user_id BIGINT,
  start_id INTEGER,
  hashtag VARCHAR,
  PRIMARY KEY(user_id, start_id, hashtag),
  CONSTRAINT foreign_key_user
    FOREIGN KEY(user_id)
      REFERENCES users(user_id)
);

CREATE TABLE emojis(
  user_id BIGINT,
  start_id INTEGER,
  emoji VARCHAR,
  count INTEGER,
  PRIMARY KEY(user_id, start_id, emoji),
  CONSTRAINT foreign_key_user
    FOREIGN KEY(user_id)
      REFERENCES users(user_id)
);

CREATE TABLE schedules(
  user_id BIGINT,
  time VARCHAR,
  questions VARCHAR[],
  PRIMARY KEY(user_id, time),
  CONSTRAINT foreign_key_user
    FOREIGN KEY(user_id)
      REFERENCES users(user_id)
);
