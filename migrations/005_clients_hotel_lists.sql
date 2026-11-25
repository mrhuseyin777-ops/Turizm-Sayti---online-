-- 005: B2B müştəri bazası (mini-CRM) və agentliyin tövsiyə olunan otel siyahıları.
--  - clients: agentliyə bağlı müştəri kartı (IDOR: bütün sorğular agency_id ilə). Şəxsi məlumat: ad, telefon,
--    e-poçt, uşaq yaşları, qeyd. Saxlama: son fəaliyyətdən 365 gün sonra avtomatik silinir (src/storage/cleanup.js),
--    "Unut" düyməsi kartı silir və əlaqəli seçilmiş/link/müraciətləri anonimləşdirir (src/clients.js).
--  - shortlist_items / selections / leads: yeni nullable client_id (müştəri silinəndə NULL olur).
--  - hotel_lists: agentliyin daimi otel siyahıları ("Ailələr üçün", "Romantik" ...) — tarixsiz, otel səviyyəsində.
-- İdempotentdir (IF NOT EXISTS / ADD COLUMN IF NOT EXISTS): təkrar işə salmaq təhlükəsizdir.

CREATE TABLE IF NOT EXISTS clients (
  id                text PRIMARY KEY CHECK (id ~ '^cl_[A-Za-z0-9_-]{12}$'),
  agency_id         text NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  name              text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 80),
  phone             text NOT NULL DEFAULT '' CHECK (char_length(phone) <= 30),
  email             text NOT NULL DEFAULT '' CHECK (char_length(email) <= 120),
  adults            smallint NOT NULL DEFAULT 2 CHECK (adults BETWEEN 1 AND 8),
  child_ages        jsonb NOT NULL DEFAULT '[]' CHECK (jsonb_typeof(child_ages) = 'array' AND jsonb_array_length(child_ages) <= 6),
  budget            integer CHECK (budget IS NULL OR (budget >= 0 AND budget <= 10000000)),
  destinations      jsonb NOT NULL DEFAULT '[]' CHECK (jsonb_typeof(destinations) = 'array' AND jsonb_array_length(destinations) <= 10),
  board             text NOT NULL DEFAULT '' CHECK (board IN ('', 'RO', 'BB', 'HB', 'FB', 'AI', 'UAI')),
  note              text NOT NULL DEFAULT '' CHECK (char_length(note) <= 1000),
  -- son axtarışlar (axtarış parametrləri, maks. 20) — müştəri kartındakı tarixçə
  searches          jsonb NOT NULL DEFAULT '[]' CHECK (jsonb_typeof(searches) = 'array' AND jsonb_array_length(searches) <= 20),
  created_by        text CHECK (char_length(created_by) <= 80),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  last_activity_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS clients_agency_idx ON clients (agency_id, last_activity_at DESC);
CREATE INDEX IF NOT EXISTS clients_activity_idx ON clients (last_activity_at);

ALTER TABLE shortlist_items ADD COLUMN IF NOT EXISTS client_id text REFERENCES clients(id) ON DELETE SET NULL;
ALTER TABLE selections ADD COLUMN IF NOT EXISTS client_id text REFERENCES clients(id) ON DELETE SET NULL;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS client_id text REFERENCES clients(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS shortlist_items_client_idx ON shortlist_items (client_id) WHERE client_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS selections_client_idx ON selections (client_id) WHERE client_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS leads_client_idx ON leads (client_id) WHERE client_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS hotel_lists (
  id          text PRIMARY KEY CHECK (id ~ '^hl_[A-Za-z0-9_-]{12}$'),
  agency_id   text NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  name        text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 60),
  -- [{ id, name, destination, stars }] — maks. 60 otel (axtarışın hotels filtri limiti)
  hotels      jsonb NOT NULL DEFAULT '[]' CHECK (jsonb_typeof(hotels) = 'array' AND jsonb_array_length(hotels) <= 60),
  created_by  text CHECK (char_length(created_by) <= 80),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS hotel_lists_agency_name_uq ON hotel_lists (agency_id, lower(name));
