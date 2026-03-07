-- Session table (required by connect-pg-simple)
CREATE TABLE IF NOT EXISTS "session" (
  "sid" VARCHAR NOT NULL COLLATE "default",
  "sess" JSON NOT NULL,
  "expire" TIMESTAMP(6) NOT NULL,
  CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
);
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");

-- Admin users (populated on Discord OAuth login)
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  discord_id    VARCHAR(255) UNIQUE NOT NULL,
  username      VARCHAR(255) NOT NULL,
  avatar        VARCHAR(255),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Bingo boards
CREATE TABLE IF NOT EXISTS boards (
  id            VARCHAR(12) PRIMARY KEY,
  user_id       INTEGER NOT NULL REFERENCES users(id),
  title         VARCHAR(255) NOT NULL,
  free_space    BOOLEAN DEFAULT true,
  free_space_text VARCHAR(255),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE boards ADD COLUMN IF NOT EXISTS free_space_text VARCHAR(255);

-- Item pool for each board
CREATE TABLE IF NOT EXISTS board_items (
  id            SERIAL PRIMARY KEY,
  board_id      VARCHAR(12) NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  text          VARCHAR(255) NOT NULL,
  sort_order    INTEGER NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
