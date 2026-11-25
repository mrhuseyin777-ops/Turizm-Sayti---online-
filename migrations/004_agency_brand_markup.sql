-- 004: agentlik brend profili (görünən ad, loqo, rəng, əlaqə, lisenziya) və çevik komissiya qaydaları.
-- Seçim linkinə "oxşar otellər" bloku üçün sütun.
-- İdempotentdir: CREATE ... IF NOT EXISTS, ADD COLUMN IF NOT EXISTS. Təkrar işə salmaq təhlükəsizdir.

-- Brend profili. public_id — təxmin edilə bilməyən ictimai id (loqo URL-i /a/<public_id>/logo):
-- agentliyin daxili id-si (ag_...) heç vaxt public URL-ə düşmür.
CREATE TABLE IF NOT EXISTS agency_brand (
  agency_id        text PRIMARY KEY REFERENCES agencies(id) ON DELETE CASCADE,
  public_id        text NOT NULL UNIQUE CHECK (public_id ~ '^pb_[A-Za-z0-9_-]{16}$'),
  display_name     text NOT NULL DEFAULT '' CHECK (char_length(display_name) <= 80),
  color            text CHECK (color ~ '^#[0-9a-f]{6}$'),
  phone            text NOT NULL DEFAULT '' CHECK (char_length(phone) <= 30),
  whatsapp         text NOT NULL DEFAULT '' CHECK (char_length(whatsapp) <= 30),
  license_no       text NOT NULL DEFAULT '' CHECK (char_length(license_no) <= 40),
  address          text NOT NULL DEFAULT '' CHECK (char_length(address) <= 160),
  website          text NOT NULL DEFAULT '' CHECK (char_length(website) <= 200),
  -- Loqo: yalnız PNG/JPEG/WebP (serverdə magic-byte ilə yoxlanılır), maks. 200 KB
  logo             bytea CHECK (logo IS NULL OR octet_length(logo) <= 204800),
  logo_mime        text CHECK (logo_mime IN ('image/png', 'image/jpeg', 'image/webp')),
  logo_sha256      text CHECK (logo_sha256 ~ '^[0-9a-f]{64}$'),
  logo_updated_at  timestamptz,
  updated_at       timestamptz NOT NULL DEFAULT now(),
  updated_by       text CHECK (char_length(updated_by) <= 80),
  CHECK ((logo IS NULL) = (logo_mime IS NULL))
);

-- Komissiya qaydaları (JSON: defaultPct, fixed, minMargin, rounding, rules[]) — validasiya src/markup.js
CREATE TABLE IF NOT EXISTS agency_markup (
  agency_id   text PRIMARY KEY REFERENCES agencies(id) ON DELETE CASCADE,
  config      jsonb NOT NULL CHECK (jsonb_typeof(config) = 'object' AND octet_length(config::text) <= 16384),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  updated_by  text CHECK (char_length(updated_by) <= 80)
);

-- Seçim linki: "Oxşar otellər" (yaradılarkən serverdə hesablanır, qiymətlər komissiya qaydaları ilə)
ALTER TABLE selections ADD COLUMN IF NOT EXISTS similar_hotels jsonb NOT NULL DEFAULT '[]'::jsonb
  CHECK (jsonb_typeof(similar_hotels) = 'array');
