CREATE TABLE IF NOT EXISTS users (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  ig_account_id      TEXT    NOT NULL UNIQUE,
  username           TEXT    NOT NULL DEFAULT '',
  access_token_enc   TEXT    NOT NULL,
  token_issued_at    INTEGER NOT NULL,
  token_expires_at   INTEGER NOT NULL,
  scopes             TEXT    NOT NULL DEFAULT '',
  status             TEXT    NOT NULL DEFAULT 'active',
  created_at         INTEGER NOT NULL,
  updated_at         INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS carousels (
  id          TEXT    PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        TEXT    NOT NULL,
  enabled     INTEGER NOT NULL DEFAULT 1,
  config      TEXT    NOT NULL,
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_carousels_user ON carousels(user_id);

CREATE TABLE IF NOT EXISTS events (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id        INTEGER,
  ig_account_id  TEXT,
  type           TEXT NOT NULL,
  detail         TEXT,
  created_at     INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_events_created ON events(created_at);

CREATE TABLE IF NOT EXISTS processed_events (
  id          TEXT PRIMARY KEY,
  created_at  INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS conversation_state (
  user_id      INTEGER NOT NULL,
  sender_igsid TEXT    NOT NULL,
  carousel_id  TEXT,
  updated_at   INTEGER NOT NULL,
  PRIMARY KEY (user_id, sender_igsid)
);
