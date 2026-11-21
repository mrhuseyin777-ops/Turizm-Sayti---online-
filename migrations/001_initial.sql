-- 001: ilkin sxem — agentliklər, istifadəçilər, sessiyalar, B2B seçim linkləri, müraciətlər (leadlər),
-- aviabilet qiymət izləmələri, avia/avto müraciətləri.
-- İdempotentdir (IF NOT EXISTS): təkrar işə salmaq təhlükəsizdir. Tətbiq: src/db/migrate.js.
-- Şəxsi məlumat: parollar yalnız scrypt hash, sessiya id-si yalnız SHA-256 hash, IP yalnız hash.

CREATE TABLE IF NOT EXISTS agencies (
  id          text PRIMARY KEY CHECK (id ~ '^ag_[A-Za-z0-9_-]{12}$'),
  name        text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 80),
  -- Böyük/kiçik hərfə həssas olmayan unikallıq (az lokalı ilə JS-də hesablanır)
  name_key    text NOT NULL UNIQUE,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id                   text PRIMARY KEY CHECK (id ~ '^usr_[A-Za-z0-9_-]{12}$'),
  agency_id            text NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  username             text NOT NULL UNIQUE CHECK (username ~ '^[a-z0-9][a-z0-9._@-]{2,63}$'),
  display_name         text NOT NULL CHECK (char_length(display_name) BETWEEN 1 AND 80),
  role                 text NOT NULL CHECK (role IN ('admin', 'manager')),
  password_hash        text NOT NULL CHECK (password_hash LIKE 'scrypt$%'),
  disabled             boolean NOT NULL DEFAULT false,
  created_at           timestamptz NOT NULL DEFAULT now(),
  password_changed_at  timestamptz NOT NULL DEFAULT now(),
  last_login_at        timestamptz
);
CREATE INDEX IF NOT EXISTS users_agency_idx ON users (agency_id);

-- Sessiya id-nin özü yox, SHA-256 hash-i (base64url, 43 simvol) saxlanılır
CREATE TABLE IF NOT EXISTS sessions (
  id_hash       text PRIMARY KEY CHECK (char_length(id_hash) = 43),
  user_id       text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agency_id     text NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  csrf_token    text NOT NULL CHECK (char_length(csrf_token) = 43),
  created_at    timestamptz NOT NULL,
  last_seen_at  timestamptz NOT NULL,
  expires_at    timestamptz NOT NULL,
  CHECK (expires_at > created_at)
);
CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions (user_id, created_at);
CREATE INDEX IF NOT EXISTS sessions_expires_idx ON sessions (expires_at);
CREATE INDEX IF NOT EXISTS sessions_last_seen_idx ON sessions (last_seen_at);

-- B2B paylaşılan seçim linkləri (72 bitlik təsadüfi id = capability URL), 30 gün yaşayır
CREATE TABLE IF NOT EXISTS selections (
  id           text PRIMARY KEY CHECK (id ~ '^[A-Za-z0-9_-]{12}$'),
  agency_id    text NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  agency_name  text NOT NULL CHECK (char_length(agency_name) <= 80),
  manager      text NOT NULL DEFAULT '' CHECK (char_length(manager) <= 80),
  client       text NOT NULL DEFAULT '' CHECK (char_length(client) <= 80),
  phone        text NOT NULL DEFAULT '' CHECK (char_length(phone) <= 30),
  message      text NOT NULL DEFAULT '' CHECK (char_length(message) <= 400),
  currency     text NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
  markup       double precision NOT NULL CHECK (markup >= 0 AND markup <= 100),
  pax          jsonb NOT NULL CHECK (jsonb_typeof(pax) = 'object'),
  items        jsonb NOT NULL CHECK (jsonb_typeof(items) = 'array'),
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS selections_agency_idx ON selections (agency_id, created_at);
CREATE INDEX IF NOT EXISTS selections_created_idx ON selections (created_at);

-- Müraciətlər (leadlər). type='selection' olanlar agentliyə bağlıdır (IDOR: yalnız öz agency_id-si)
CREATE TABLE IF NOT EXISTS leads (
  id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  type            text NOT NULL CHECK (type IN ('offer', 'callback', 'selection')),
  name            text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 80),
  phone           text NOT NULL CHECK (char_length(phone) BETWEEN 5 AND 30),
  note            text NOT NULL DEFAULT '' CHECK (char_length(note) <= 500),
  offer_id        text CHECK (char_length(offer_id) <= 200),
  preferred_time  text CHECK (preferred_time IN ('now', 'morning', 'afternoon', 'evening')),
  context         text CHECK (char_length(context) <= 300),
  selection_id    text REFERENCES selections(id) ON DELETE SET NULL,
  agency_id       text REFERENCES agencies(id) ON DELETE CASCADE,
  agency_name     text CHECK (char_length(agency_name) <= 80),
  manager         text CHECK (char_length(manager) <= 80),
  client          text CHECK (char_length(client) <= 80),
  item            jsonb,
  created_at      timestamptz NOT NULL DEFAULT now(),
  CHECK (type <> 'selection' OR agency_id IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS leads_agency_idx ON leads (agency_id, created_at DESC) WHERE type = 'selection';
CREATE INDEX IF NOT EXISTS leads_created_idx ON leads (created_at);

-- Aviabilet qiymət izləmələri: token yalnız SHA-256 hash (hex), IP yalnız hash (ip_key)
CREATE TABLE IF NOT EXISTS flight_alerts (
  id                text PRIMARY KEY CHECK (id ~ '^fa_[A-Za-z0-9_-]{16}$'),
  token_hash        text NOT NULL CHECK (token_hash ~ '^[0-9a-f]{64}$'),
  route             jsonb NOT NULL CHECK (jsonb_typeof(route) = 'object'),
  depart_date       date NOT NULL,
  mode              text NOT NULL CHECK (mode IN ('daily', 'drop10')),
  email             text CHECK (char_length(email) <= 120),
  initial_price     double precision,
  last_price        double precision,
  last_checked_at   timestamptz,
  last_notified_at  timestamptz,
  ip_key            text CHECK (char_length(ip_key) <= 64),
  created_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS flight_alerts_depart_idx ON flight_alerts (depart_date);
CREATE INDEX IF NOT EXISTS flight_alerts_ip_idx ON flight_alerts (ip_key);

-- "Bileti sifariş et" müraciətləri (pasport/sənəd məlumatı saxlanılmır)
CREATE TABLE IF NOT EXISTS flight_requests (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name        text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 80),
  phone       text NOT NULL CHECK (char_length(phone) BETWEEN 5 AND 30),
  email       text CHECK (char_length(email) <= 120),
  note        text NOT NULL DEFAULT '' CHECK (char_length(note) <= 500),
  flight_id   text NOT NULL CHECK (char_length(flight_id) <= 300),
  offer_id    text CHECK (char_length(offer_id) <= 340),
  ip_hash     text CHECK (char_length(ip_hash) <= 64),
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS flight_requests_created_idx ON flight_requests (created_at);

-- Avtomobil icarəsi / transfer müraciətləri (sürücülük vəsiqəsi və s. saxlanılmır)
CREATE TABLE IF NOT EXISTS car_requests (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  kind        text NOT NULL CHECK (kind IN ('rental', 'transfer')),
  name        text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 80),
  phone       text NOT NULL CHECK (char_length(phone) BETWEEN 5 AND 30),
  note        text NOT NULL DEFAULT '' CHECK (char_length(note) <= 500),
  offer_id    text NOT NULL CHECK (char_length(offer_id) <= 100),
  summary     jsonb NOT NULL CHECK (jsonb_typeof(summary) = 'object'),
  status      text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'closed')),
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS car_requests_created_idx ON car_requests (created_at);
