-- 006: agentlik vidjeti (/w/<publicId>), B2C marketplace (tərəfdaş agentlik seçimi) və müraciət status
-- səhifəsi (/r/<token>).
--  - agency_widget: agentliyin vidjet və marketplace ayarları. public_id (vidjet) və market_id (marketplace
--    siyahısındakı id) — təsadüfi, təxmin edilə bilməyən id-lər; agentliyin daxili id-si (ag_...) heç vaxt
--    ictimai səhifəyə çıxmır. frame_domains — vidjeti iframe-də göstərə bilən saytlar (CSP frame-ancestors).
--  - leads.source: agentliyə bağlı müraciətin mənbəyi (selection | widget | marketplace; köhnə qeydlər NULL = selection)
--  - leads.status_token_hash: müştərinin status linkindəki tokenin YALNIZ SHA-256 hash-i (hex)
-- İdempotentdir (IF NOT EXISTS): təkrar işə salmaq təhlükəsizdir. Tətbiq: src/db/migrate.js.

CREATE TABLE IF NOT EXISTS agency_widget (
  agency_id       text PRIMARY KEY REFERENCES agencies(id) ON DELETE CASCADE,
  public_id       text UNIQUE CHECK (public_id ~ '^[A-Za-z0-9_-]{22}$'),
  frame_domains   jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(frame_domains) = 'array' AND jsonb_array_length(frame_domains) <= 10),
  markup_pct      double precision NOT NULL DEFAULT 0 CHECK (markup_pct >= 0 AND markup_pct <= 100),
  market_enabled  boolean NOT NULL DEFAULT false,
  market_id       text UNIQUE CHECK (market_id ~ '^[A-Za-z0-9_-]{16}$'),
  market_name     text NOT NULL DEFAULT '' CHECK (char_length(market_name) <= 80),
  market_city     text NOT NULL DEFAULT '' CHECK (char_length(market_city) <= 60),
  market_phone    text NOT NULL DEFAULT '' CHECK (char_length(market_phone) <= 30),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  updated_by      text CHECK (char_length(updated_by) <= 80)
);
CREATE INDEX IF NOT EXISTS agency_widget_market_idx ON agency_widget (market_enabled) WHERE market_enabled;

ALTER TABLE leads ADD COLUMN IF NOT EXISTS source text
  CHECK (source IN ('selection', 'widget', 'marketplace'));
ALTER TABLE leads ADD COLUMN IF NOT EXISTS status_token_hash text
  CHECK (status_token_hash ~ '^[0-9a-f]{64}$');
CREATE UNIQUE INDEX IF NOT EXISTS leads_status_token_idx ON leads (status_token_hash) WHERE status_token_hash IS NOT NULL;
