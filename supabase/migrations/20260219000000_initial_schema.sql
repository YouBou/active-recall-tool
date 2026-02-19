CREATE TABLE decks (
  id           TEXT        PRIMARY KEY,
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name         TEXT        NOT NULL,
  description  TEXT        NOT NULL DEFAULT '',
  category     TEXT        NOT NULL DEFAULT '',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_decks_user_id ON decks(user_id);
ALTER TABLE decks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own decks" ON decks FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE cards (
  id            TEXT        PRIMARY KEY,
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  deck_id       TEXT        NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
  type          TEXT        NOT NULL CHECK (type IN ('text','code','image','multiple-choice')),
  front         TEXT        NOT NULL,
  back          TEXT        NOT NULL DEFAULT '',
  language      TEXT,
  image_url     TEXT,
  options       JSONB,
  interval      INTEGER     NOT NULL DEFAULT 1,
  ease_factor   REAL        NOT NULL DEFAULT 2.5,
  repetitions   INTEGER     NOT NULL DEFAULT 0,
  next_review   TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_review   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_cards_user_id    ON cards(user_id);
CREATE INDEX idx_cards_deck_id    ON cards(deck_id);
CREATE INDEX idx_cards_next_review ON cards(next_review);
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own cards" ON cards FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE study_sessions (
  id             TEXT        PRIMARY KEY,
  user_id        UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  deck_id        TEXT        NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
  started_at     TIMESTAMPTZ NOT NULL,
  ended_at       TIMESTAMPTZ,
  cards_studied  INTEGER     NOT NULL DEFAULT 0,
  ratings_forgot INTEGER     NOT NULL DEFAULT 0,
  ratings_hard   INTEGER     NOT NULL DEFAULT 0,
  ratings_good   INTEGER     NOT NULL DEFAULT 0
);
CREATE INDEX idx_sessions_user_id ON study_sessions(user_id);
CREATE INDEX idx_sessions_deck_id ON study_sessions(deck_id);
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own sessions" ON study_sessions FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Auto-update updated_at on row changes
CREATE EXTENSION IF NOT EXISTS moddatetime;

CREATE TRIGGER handle_updated_at_decks
  BEFORE UPDATE ON decks
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

CREATE TRIGGER handle_updated_at_cards
  BEFORE UPDATE ON cards
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);
