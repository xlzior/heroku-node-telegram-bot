CREATE TABLE users(
  user_id INTEGER PRIMARY KEY,
  level INTEGER,
  xp INTEGER,
  pinned_message_id INTEGER,
  idat INTEGER,
  current_reflection_id INTEGER,
  prev_command VARCHAR
);

CREATE TABLE reflections(
  user_id INTEGER,
  start_id INTEGER,
  end_id INTEGER,
  name VARCHAR,
  PRIMARY KEY(user_id, start_id),
  CONSTRAINT foreign_key_user
    FOREIGN KEY(user_id)
      REFERENCES users(user_id)
);

CREATE TABLE achievements(
  user_id INTEGER,
  type VARCHAR,
  level SMALLINT,
  PRIMARY KEY(user_id, type),
  CONSTRAINT foreign_key_user
    FOREIGN KEY(user_id)
      REFERENCES users(user_id)
);

CREATE TABLE hashtags(
  user_id INTEGER,
  start_id INTEGER,
  hashtag VARCHAR,
  PRIMARY KEY(user_id, start_id, hashtag),
  CONSTRAINT foreign_key_user
    FOREIGN KEY(user_id)
      REFERENCES users(user_id)
);

CREATE TABLE emojis(
  user_id INTEGER,
  start_id INTEGER,
  emoji VARCHAR,
  count INTEGER,
  PRIMARY KEY(user_id, start_id, emoji),
  CONSTRAINT foreign_key_user
    FOREIGN KEY(user_id)
      REFERENCES users(user_id)
);