-- 002: müraciət CRM (status, menecer qeydi, statusu kim/nə vaxt dəyişib, son yeniləmə) və agentlik
-- bildiriş ayarları (Telegram chat_id, bildiriş e-poçtu).
-- İdempotentdir: ADD COLUMN IF NOT EXISTS (sütun səviyyəli CHECK yalnız sütun yaradılanda əlavə olunur),
-- CREATE ... IF NOT EXISTS. Təkrar işə salmaq təhlükəsizdir.

ALTER TABLE leads ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'new'
  CHECK (status IN ('new', 'in_progress', 'sold', 'cancelled'));
ALTER TABLE leads ADD COLUMN IF NOT EXISTS manager_note text NOT NULL DEFAULT ''
  CHECK (char_length(manager_note) <= 1000);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS status_changed_at timestamptz;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS status_changed_by text
  CHECK (char_length(status_changed_by) <= 80);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS updated_at timestamptz;
CREATE INDEX IF NOT EXISTS leads_agency_status_idx ON leads (agency_id, status) WHERE type = 'selection';

-- Agentliyin bildiriş ayarları (agentlik silinəndə ayarlar da silinir)
CREATE TABLE IF NOT EXISTS agency_settings (
  agency_id         text PRIMARY KEY REFERENCES agencies(id) ON DELETE CASCADE,
  -- Telegram chat_id: rəqəm (qrup üçün mənfi, məs. -100123...) və ya @kanal_adi
  telegram_chat_id  text CHECK (telegram_chat_id ~ '^(-?[0-9]{1,20}|@[A-Za-z][A-Za-z0-9_]{4,31})$'),
  notify_email      text CHECK (char_length(notify_email) <= 120),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  updated_by        text CHECK (char_length(updated_by) <= 80)
);
