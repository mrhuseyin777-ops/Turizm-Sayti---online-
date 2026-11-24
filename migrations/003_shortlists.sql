-- 003: B2B "Seçilmişlər" (shortlist) — menecerin müştəri sorğusu üzrə yadda saxladığı variantlar.
-- Agentliyə bağlıdır (IDOR: bütün sorğular agency_id ilə). Qiymət serverin öz axtarışından götürülür,
-- "Qiyməti yenilə" ilə yenidən yoxlanılır (prev_net_price — əvvəlki qiymət, ↑/↓ üçün).
-- İdempotentdir (IF NOT EXISTS): təkrar işə salmaq təhlükəsizdir. Tətbiq: src/db/migrate.js.

CREATE TABLE IF NOT EXISTS shortlist_items (
  id              text PRIMARY KEY CHECK (id ~ '^sl_[A-Za-z0-9_-]{12}$'),
  agency_id       text NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  user_id         text REFERENCES users(id) ON DELETE SET NULL,
  client          text NOT NULL DEFAULT '' CHECK (char_length(client) <= 80),
  offer_id        text NOT NULL CHECK (char_length(offer_id) BETWEEN 1 AND 200),
  -- eyni təklif fərqli sərnişin tərkibi ilə fərqli qiymətdir: "adults|childAges"
  pax_key         text NOT NULL CHECK (char_length(pax_key) <= 40),
  query           jsonb NOT NULL CHECK (jsonb_typeof(query) = 'object'),
  snapshot        jsonb NOT NULL CHECK (jsonb_typeof(snapshot) = 'object'),
  net_price       double precision NOT NULL CHECK (net_price > 0 AND net_price <= 10000000),
  prev_net_price  double precision CHECK (prev_net_price IS NULL OR prev_net_price > 0),
  available       boolean NOT NULL DEFAULT true,
  checked_at      timestamptz NOT NULL DEFAULT now(),
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (agency_id, client, offer_id, pax_key)
);
CREATE INDEX IF NOT EXISTS shortlist_items_agency_idx ON shortlist_items (agency_id, created_at);
CREATE INDEX IF NOT EXISTS shortlist_items_created_idx ON shortlist_items (created_at);
