// PostgreSQL implementasiyası (DATABASE_URL təyin olunanda). Interfeys: src/storage/index.js.
// Bütün sorğular parametrləşdirilmişdir ($1, $2 ...). Dinamik sütun adları yalnız sabit ağ siyahıdan
// (USER_COLUMNS) götürülür — istifadəçi dəyəri heç vaxt SQL mətninə birləşdirilmir.
const crypto = require('crypto');
const { USERNAME_RE, ROLES, clean, normUsername, agencyNameKey, validateNewUser } = require('../auth/store');

const iso = (d) => (d == null ? null : new Date(d).toISOString());
const msOf = (d) => (d == null ? null : new Date(d).getTime());
const num = (v) => (v == null ? null : Number(v));
const newId = (prefix) => `${prefix}_${crypto.randomBytes(9).toString('base64url')}`;
const UNIQUE_VIOLATION = '23505';

function createRepos(pool) {
  const q = (text, params = []) => pool.query(text, params);

  // ---------------------------------------------------------------- Agentliklər və istifadəçilər
  const agencyRow = (r) => (r ? { id: r.id, name: r.name, createdAt: iso(r.created_at) } : null);
  const userRow = (r) => (r ? {
    id: r.id, agencyId: r.agency_id, username: r.username, displayName: r.display_name, role: r.role,
    passwordHash: r.password_hash, disabled: r.disabled, createdAt: iso(r.created_at),
    passwordChangedAt: iso(r.password_changed_at), lastLoginAt: iso(r.last_login_at),
  } : null);
  const USER_COLUMNS = {
    passwordHash: 'password_hash', disabled: 'disabled', displayName: 'display_name', role: 'role',
    lastLoginAt: 'last_login_at', passwordChangedAt: 'password_changed_at',
  };

  const accounts = {
    kind: 'postgres',
    USERNAME_RE,
    ROLES,
    normUsername,
    describe: () => 'PostgreSQL (DATABASE_URL)',
    async getAgency(id) {
      if (typeof id !== 'string') return null;
      return agencyRow((await q('SELECT id, name, created_at FROM agencies WHERE id = $1', [id])).rows[0]);
    },
    async findAgencyByName(name) {
      return agencyRow((await q('SELECT id, name, created_at FROM agencies WHERE name_key = $1', [agencyNameKey(name)])).rows[0]);
    },
    async listAgencies() {
      const { rows } = await q(`SELECT a.id, a.name, a.created_at, count(u.id)::int AS users
        FROM agencies a LEFT JOIN users u ON u.agency_id = a.id GROUP BY a.id ORDER BY a.created_at`);
      return rows.map((r) => ({ ...agencyRow(r), users: r.users }));
    },
    // persist parametri fayl implementasiyası üçündür; DB-də hər hesab daimidir
    async createAgency(name) {
      const n = clean(name, 80);
      if (n.length < 2) throw new Error('Agentlik adı ən azı 2 simvol olmalıdır');
      try {
        const { rows } = await q('INSERT INTO agencies (id, name, name_key) VALUES ($1, $2, $3) RETURNING id, name, created_at', [newId('ag'), n, agencyNameKey(n)]);
        return agencyRow(rows[0]);
      } catch (e) {
        if (e.code === UNIQUE_VIOLATION) throw new Error('Bu adda agentlik artıq var', { cause: e });
        throw e;
      }
    },
    async getUser(id) {
      if (typeof id !== 'string') return null;
      return userRow((await q('SELECT * FROM users WHERE id = $1', [id])).rows[0]);
    },
    async findUserByUsername(username) {
      return userRow((await q('SELECT * FROM users WHERE username = $1', [normUsername(username)])).rows[0]);
    },
    async createUser({ agencyId, username, displayName, role = 'manager', passwordHash }) {
      const u = validateNewUser({ username, role, passwordHash });
      if (!(await accounts.getAgency(agencyId))) throw new Error('Agentlik tapılmadı');
      try {
        const { rows } = await q(`INSERT INTO users (id, agency_id, username, display_name, role, password_hash)
          VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`, [newId('usr'), agencyId, u, clean(displayName, 80) || u, role, passwordHash]);
        return userRow(rows[0]);
      } catch (e) {
        if (e.code === UNIQUE_VIOLATION) throw new Error('Bu istifadəçi adı artıq mövcuddur', { cause: e });
        throw e;
      }
    },
    async updateUser(id, patch) {
      const sets = [];
      const vals = [id];
      for (const [k, col] of Object.entries(USER_COLUMNS)) {
        if (!(k in patch)) continue;
        vals.push(patch[k]);
        sets.push(`${col} = $${vals.length}`);
      }
      if (!sets.length) {
        const u = await accounts.getUser(id);
        if (!u) throw new Error('İstifadəçi tapılmadı');
        return u;
      }
      const { rows } = await q(`UPDATE users SET ${sets.join(', ')} WHERE id = $1 RETURNING *`, vals);
      if (!rows[0]) throw new Error('İstifadəçi tapılmadı');
      return userRow(rows[0]);
    },
  };

  // ---------------------------------------------------------------- Sessiyalar (id yalnız SHA-256 hash)
  const sessions = {
    async insert({ keyHash, userId, agencyId, csrf, createdAt, lastSeen, expiresAt }) {
      await q(`INSERT INTO sessions (id_hash, user_id, agency_id, csrf_token, created_at, last_seen_at, expires_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)`, [keyHash, userId, agencyId, csrf, new Date(createdAt), new Date(lastSeen), new Date(expiresAt)]);
    },
    async get(keyHash) {
      const r = (await q('SELECT user_id, agency_id, csrf_token, created_at, last_seen_at, expires_at FROM sessions WHERE id_hash = $1', [keyHash])).rows[0];
      return r ? { userId: r.user_id, agencyId: r.agency_id, csrf: r.csrf_token, createdAt: msOf(r.created_at), lastSeen: msOf(r.last_seen_at), expiresAt: msOf(r.expires_at) } : null;
    },
    async touch(keyHash, lastSeen) {
      await q('UPDATE sessions SET last_seen_at = $2 WHERE id_hash = $1', [keyHash, new Date(lastSeen)]);
    },
    async delete(keyHash) { await q('DELETE FROM sessions WHERE id_hash = $1', [keyHash]); },
    async deleteForUser(userId) { await q('DELETE FROM sessions WHERE user_id = $1', [userId]); },
    async trimForUser(userId, keep) {
      await q(`DELETE FROM sessions WHERE id_hash IN (
        SELECT id_hash FROM sessions WHERE user_id = $1 ORDER BY created_at DESC, id_hash OFFSET $2)`, [userId, Math.max(0, keep)]);
    },
    async purgeExpired({ now = Date.now(), idleMs }) {
      const r = await q('DELETE FROM sessions WHERE expires_at <= $1 OR last_seen_at < $2', [new Date(now), new Date(now - idleMs)]);
      return r.rowCount;
    },
    async count() { return (await q('SELECT count(*)::int AS n FROM sessions')).rows[0].n; },
  };

  // ---------------------------------------------------------------- Leadlər
  const leadRow = (r) => {
    const l = {
      id: Number(r.id), type: r.type, name: r.name, phone: r.phone, note: r.note, offerId: r.offer_id, createdAt: iso(r.created_at),
      status: r.status || 'new', managerNote: r.manager_note || '', statusChangedAt: iso(r.status_changed_at),
      statusChangedBy: r.status_changed_by ?? null, updatedAt: iso(r.updated_at || r.created_at),
    };
    if (r.type === 'callback') { l.preferredTime = r.preferred_time; l.context = r.context; }
    if (r.type === 'selection') {
      Object.assign(l, { selectionId: r.selection_id, agencyId: r.agency_id, agency: r.agency_name, manager: r.manager, client: r.client, item: r.item });
    }
    // Mənbə (006): agentliyə bağlı müraciətlərdə köhnə qeydlər (NULL) = seçim linki. Token hash-i qaytarılmır.
    l.source = r.type === 'selection' ? r.source || 'selection' : r.source || null;
    return l;
  };
  const leads = {
    async insert(l) {
      const { rows } = await q(`INSERT INTO leads (type, name, phone, note, offer_id, preferred_time, context,
          selection_id, agency_id, agency_name, manager, client, item, created_at, source, status_token_hash)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING *`, [
        l.type, l.name, l.phone, l.note || '', l.offerId || null, l.preferredTime || null, l.context || null,
        l.selectionId || null, l.agencyId || null, l.agency ?? null, l.manager ?? null, l.client ?? null,
        l.item ? JSON.stringify(l.item) : null, l.createdAt ? new Date(l.createdAt) : new Date(),
        l.source || null, l.statusTokenHash || null,
      ]);
      return leadRow(rows[0]);
    },
    // Müştərinin status səhifəsi (/r/<token>): yalnız tokenin SHA-256 hash-i ilə (unikal indeks)
    async getByStatusTokenHash(hash) {
      if (typeof hash !== 'string' || !/^[0-9a-f]{64}$/.test(hash)) return null;
      const r = (await q('SELECT * FROM leads WHERE status_token_hash = $1', [hash])).rows[0];
      return r ? leadRow(r) : null;
    },
    async listForAgency(agencyId, limit = 200, { status } = {}) {
      if (typeof agencyId !== 'string' || !agencyId) return [];
      const { rows } = await q(`SELECT * FROM leads WHERE type = 'selection' AND agency_id = $1
          AND ($3::text IS NULL OR status = $3)
        ORDER BY created_at DESC, id DESC LIMIT $2`, [agencyId, limit, status || null]);
      return rows.map(leadRow);
    },
    async statusCountsForAgency(agencyId) {
      if (typeof agencyId !== 'string' || !agencyId) return {};
      const { rows } = await q(`SELECT status, count(*)::int AS n FROM leads WHERE type = 'selection' AND agency_id = $1
        GROUP BY status`, [agencyId]);
      return Object.fromEntries(rows.map((r) => [r.status, r.n]));
    },
    // IDOR: WHERE şərtində agency_id — başqa agentliyin müraciəti heç vaxt yenilənmir (tapılmasa null)
    async updateForAgency(agencyId, id, { status, managerNote, by, now = new Date() }) {
      if (typeof agencyId !== 'string' || !agencyId || !Number.isSafeInteger(id)) return null;
      const { rows } = await q(`UPDATE leads SET
          status_changed_at = CASE WHEN $3::text IS NOT NULL AND $3 <> status THEN $6::timestamptz ELSE status_changed_at END,
          status_changed_by = CASE WHEN $3::text IS NOT NULL AND $3 <> status THEN $5 ELSE status_changed_by END,
          status = COALESCE($3, status),
          manager_note = COALESCE($4, manager_note),
          updated_at = $6
        WHERE id = $1 AND agency_id = $2 AND type = 'selection' RETURNING *`, [
        id, agencyId, status ?? null, managerNote ?? null, by || null, new Date(now),
      ]);
      return rows[0] ? leadRow(rows[0]) : null;
    },
    async count() { return (await q('SELECT count(*)::int AS n FROM leads')).rows[0].n; },
    async purgeBefore(date) { return (await q('DELETE FROM leads WHERE created_at < $1', [new Date(date)])).rowCount; },
  };

  // ---------------------------------------------------------------- Agentlik ayarları (bildirişlər)
  const settingsRow = (r) => (r ? { telegramChatId: r.telegram_chat_id, notifyEmail: r.notify_email, updatedAt: iso(r.updated_at), updatedBy: r.updated_by } : null);
  const agencySettings = {
    kind: 'postgres',
    async get(agencyId) {
      if (typeof agencyId !== 'string') return null;
      return settingsRow((await q('SELECT * FROM agency_settings WHERE agency_id = $1', [agencyId])).rows[0]);
    },
    async set(agencyId, { telegramChatId = null, notifyEmail = null, updatedBy = null }) {
      const { rows } = await q(`INSERT INTO agency_settings (agency_id, telegram_chat_id, notify_email, updated_at, updated_by)
          VALUES ($1, $2, $3, now(), $4)
        ON CONFLICT (agency_id) DO UPDATE SET telegram_chat_id = EXCLUDED.telegram_chat_id, notify_email = EXCLUDED.notify_email,
          updated_at = EXCLUDED.updated_at, updated_by = EXCLUDED.updated_by
        RETURNING *`, [agencyId, telegramChatId, notifyEmail, updatedBy]);
      return settingsRow(rows[0]);
    },
  };

  // ---------------------------------------------------------------- Agentlik brend profili (loqo bytea-da)
  // Loqo baytları yalnız getLogo(publicId) ilə oxunur; get() metadata qaytarır (bytea yüklənmir).
  const BRAND_META = `agency_id, public_id, display_name, color, phone, whatsapp, license_no, address, website,
    logo_mime, octet_length(logo) AS logo_size, logo_sha256, logo_updated_at, updated_at, updated_by`;
  const brandRow = (r) => (r ? {
    publicId: r.public_id, displayName: r.display_name, color: r.color, phone: r.phone, whatsapp: r.whatsapp,
    licenseNo: r.license_no, address: r.address, website: r.website,
    logo: r.logo_mime ? { mime: r.logo_mime, size: Number(r.logo_size), sha256: r.logo_sha256, updatedAt: iso(r.logo_updated_at) } : null,
    updatedAt: iso(r.updated_at), updatedBy: r.updated_by,
  } : null);
  // Sətir yoxdursa yeni public_id ilə yarat (unikallıq toqquşmasında yenidən cəhd)
  const ensureBrand = async (agencyId, newPublicId) => {
    for (let i = 0; i < 3; i++) {
      try {
        await q('INSERT INTO agency_brand (agency_id, public_id) VALUES ($1, $2) ON CONFLICT (agency_id) DO NOTHING', [agencyId, newPublicId()]);
        return;
      } catch (e) { if (e.code !== UNIQUE_VIOLATION || i === 2) throw e; }
    }
  };
  const agencyBrand = {
    kind: 'postgres',
    async get(agencyId) {
      if (typeof agencyId !== 'string') return null;
      return brandRow((await q(`SELECT ${BRAND_META} FROM agency_brand WHERE agency_id = $1`, [agencyId])).rows[0]);
    },
    async set(agencyId, f, { newPublicId }) {
      await ensureBrand(agencyId, newPublicId);
      const { rows } = await q(`UPDATE agency_brand SET display_name = $2, color = $3, phone = $4, whatsapp = $5, license_no = $6,
          address = $7, website = $8, updated_at = now(), updated_by = $9 WHERE agency_id = $1 RETURNING ${BRAND_META}`, [
        agencyId, f.displayName || '', f.color || null, f.phone || '', f.whatsapp || '', f.licenseNo || '', f.address || '', f.website || '', f.updatedBy || null,
      ]);
      return brandRow(rows[0]);
    },
    async setLogo(agencyId, { bytes, mime, sha256, updatedBy }, { newPublicId }) {
      await ensureBrand(agencyId, newPublicId);
      const { rows } = await q(`UPDATE agency_brand SET logo = $2, logo_mime = $3, logo_sha256 = $4, logo_updated_at = now(),
          updated_at = now(), updated_by = $5 WHERE agency_id = $1 RETURNING ${BRAND_META}`, [agencyId, bytes, mime, sha256, updatedBy || null]);
      return brandRow(rows[0]);
    },
    async deleteLogo(agencyId, { updatedBy } = {}) {
      if (typeof agencyId !== 'string') return null;
      const { rows } = await q(`UPDATE agency_brand SET logo = NULL, logo_mime = NULL, logo_sha256 = NULL, logo_updated_at = NULL,
          updated_at = now(), updated_by = $2 WHERE agency_id = $1 RETURNING ${BRAND_META}`, [agencyId, updatedBy || null]);
      return brandRow(rows[0]);
    },
    async getLogo(publicId) {
      if (typeof publicId !== 'string' || !/^pb_[A-Za-z0-9_-]{16}$/.test(publicId)) return null;
      const r = (await q('SELECT logo, logo_mime, logo_sha256, logo_updated_at FROM agency_brand WHERE public_id = $1 AND logo IS NOT NULL', [publicId])).rows[0];
      return r ? { bytes: r.logo, mime: r.logo_mime, sha256: r.logo_sha256, updatedAt: iso(r.logo_updated_at) } : null;
    },
  };

  // ---------------------------------------------------------------- Komissiya qaydaları
  const agencyMarkup = {
    kind: 'postgres',
    async get(agencyId) {
      if (typeof agencyId !== 'string') return null;
      const r = (await q('SELECT config, updated_at, updated_by FROM agency_markup WHERE agency_id = $1', [agencyId])).rows[0];
      return r ? { config: r.config, updatedAt: iso(r.updated_at), updatedBy: r.updated_by } : null;
    },
    async set(agencyId, { config, updatedBy = null }) {
      const { rows } = await q(`INSERT INTO agency_markup (agency_id, config, updated_at, updated_by) VALUES ($1, $2, now(), $3)
        ON CONFLICT (agency_id) DO UPDATE SET config = EXCLUDED.config, updated_at = EXCLUDED.updated_at, updated_by = EXCLUDED.updated_by
        RETURNING config, updated_at, updated_by`, [agencyId, JSON.stringify(config), updatedBy]);
      return { config: rows[0].config, updatedAt: iso(rows[0].updated_at), updatedBy: rows[0].updated_by };
    },
  };

  // ---------------------------------------------------------------- Vidjet + marketplace ayarları (006)
  const widgetRow = (r) => (r ? {
    agencyId: r.agency_id, publicId: r.public_id, frameDomains: Array.isArray(r.frame_domains) ? r.frame_domains : [],
    markupPct: Number(r.markup_pct), marketEnabled: r.market_enabled, marketId: r.market_id, marketName: r.market_name,
    marketCity: r.market_city, marketPhone: r.market_phone, updatedAt: iso(r.updated_at), updatedBy: r.updated_by,
  } : null);
  const WIDGET_DEFAULTS = { publicId: null, frameDomains: [], markupPct: 0, marketEnabled: false, marketId: null, marketName: '', marketCity: '', marketPhone: '', updatedBy: null };
  const widgets = {
    kind: 'postgres',
    async get(agencyId) {
      if (typeof agencyId !== 'string') return null;
      return widgetRow((await q('SELECT * FROM agency_widget WHERE agency_id = $1', [agencyId])).rows[0]);
    },
    async getByPublicId(publicId) {
      if (typeof publicId !== 'string' || !publicId) return null;
      return widgetRow((await q('SELECT * FROM agency_widget WHERE public_id = $1', [publicId])).rows[0]);
    },
    async getByMarketId(marketId) {
      if (typeof marketId !== 'string' || !marketId) return null;
      return widgetRow((await q('SELECT * FROM agency_widget WHERE market_id = $1', [marketId])).rows[0]);
    },
    // patch yalnız məlum sahələrdən; qalanı mövcud qeyddən (və ya default-dan) götürülür
    async upsert(agencyId, patch) {
      const prev = (await widgets.get(agencyId)) || WIDGET_DEFAULTS;
      const n = { ...WIDGET_DEFAULTS, ...prev };
      for (const k of Object.keys(WIDGET_DEFAULTS)) if (patch && k in patch) n[k] = patch[k];
      const { rows } = await q(`INSERT INTO agency_widget (agency_id, public_id, frame_domains, markup_pct, market_enabled, market_id,
          market_name, market_city, market_phone, updated_at, updated_by)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, now(), $10)
        ON CONFLICT (agency_id) DO UPDATE SET public_id = EXCLUDED.public_id, frame_domains = EXCLUDED.frame_domains,
          markup_pct = EXCLUDED.markup_pct, market_enabled = EXCLUDED.market_enabled, market_id = EXCLUDED.market_id,
          market_name = EXCLUDED.market_name, market_city = EXCLUDED.market_city, market_phone = EXCLUDED.market_phone,
          updated_at = EXCLUDED.updated_at, updated_by = EXCLUDED.updated_by
        RETURNING *`, [
        agencyId, n.publicId, JSON.stringify(n.frameDomains || []), n.markupPct, !!n.marketEnabled, n.marketId,
        n.marketName || '', n.marketCity || '', n.marketPhone || '', n.updatedBy,
      ]);
      return widgetRow(rows[0]);
    },
    async listMarketplace() {
      const { rows } = await q(`SELECT * FROM agency_widget WHERE market_enabled AND market_id IS NOT NULL AND market_name <> ''
        ORDER BY market_name`);
      return rows.map(widgetRow);
    },
  };

  // ---------------------------------------------------------------- Seçim linkləri
  const selRow = (r) => (r ? {
    id: r.id, agencyId: r.agency_id, agency: r.agency_name, manager: r.manager, client: r.client, phone: r.phone,
    message: r.message, currency: r.currency, markup: Number(r.markup), pax: r.pax, items: r.items, similar: Array.isArray(r.similar_hotels) ? r.similar_hotels : [],
    createdAt: msOf(r.created_at),
  } : null);
  const selections = {
    async insert(s) {
      await q(`INSERT INTO selections (id, agency_id, agency_name, manager, client, phone, message, currency, markup, pax, items, similar_hotels, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`, [
        s.id, s.agencyId, s.agency, s.manager || '', s.client || '', s.phone || '', s.message || '', s.currency, s.markup,
        JSON.stringify(s.pax), JSON.stringify(s.items), JSON.stringify(Array.isArray(s.similar) ? s.similar : []), new Date(s.createdAt),
      ]);
      return s;
    },
    async get(id) {
      if (typeof id !== 'string') return null;
      return selRow((await q('SELECT * FROM selections WHERE id = $1', [id])).rows[0]);
    },
    async delete(id) { await q('DELETE FROM selections WHERE id = $1', [id]); },
    async countForAgency(agencyId) { return (await q('SELECT count(*)::int AS n FROM selections WHERE agency_id = $1', [agencyId])).rows[0].n; },
    async trimForAgency(agencyId, keep) {
      await q(`DELETE FROM selections WHERE id IN (
        SELECT id FROM selections WHERE agency_id = $1 ORDER BY created_at DESC, id OFFSET $2)`, [agencyId, Math.max(0, keep)]);
    },
    async purgeBefore(date) { return (await q('DELETE FROM selections WHERE created_at < $1', [new Date(date)])).rowCount; },
  };

  // ---------------------------------------------------------------- B2B seçilmişlər (shortlist)
  // Bütün sorğular agency_id şərti ilə (IDOR): başqa agentliyin qeydi tapılmır, dəyişmir, silinmir.
  const slRow = (r) => (r ? {
    id: r.id, agencyId: r.agency_id, userId: r.user_id, client: r.client, offerId: r.offer_id, paxKey: r.pax_key,
    query: r.query, snapshot: r.snapshot, netPrice: Number(r.net_price), prevNetPrice: num(r.prev_net_price),
    available: r.available, checkedAt: iso(r.checked_at), createdAt: iso(r.created_at),
  } : null);
  const SL_COLUMNS = { client: 'client', netPrice: 'net_price', prevNetPrice: 'prev_net_price', available: 'available', checkedAt: 'checked_at', snapshot: 'snapshot' };
  const shortlists = {
    async insert(it) {
      const { rows } = await q(`INSERT INTO shortlist_items (id, agency_id, user_id, client, offer_id, pax_key, query, snapshot,
          net_price, prev_net_price, available, checked_at, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (agency_id, client, offer_id, pax_key) DO NOTHING RETURNING *`, [
        it.id, it.agencyId, it.userId || null, it.client || '', it.offerId, it.paxKey, JSON.stringify(it.query), JSON.stringify(it.snapshot),
        it.netPrice, it.prevNetPrice ?? null, it.available !== false, new Date(it.checkedAt), new Date(it.createdAt),
      ]);
      if (rows[0]) return slRow(rows[0]);
      const ex = (await q('SELECT * FROM shortlist_items WHERE agency_id = $1 AND client = $2 AND offer_id = $3 AND pax_key = $4',
        [it.agencyId, it.client || '', it.offerId, it.paxKey])).rows[0];
      return { ...slRow(ex), existed: true };
    },
    async listForAgency(agencyId, limit = 500) {
      if (typeof agencyId !== 'string' || !agencyId) return [];
      const { rows } = await q('SELECT * FROM shortlist_items WHERE agency_id = $1 ORDER BY created_at DESC, id LIMIT $2', [agencyId, limit]);
      return rows.map(slRow);
    },
    async get(agencyId, id) {
      if (typeof agencyId !== 'string' || typeof id !== 'string') return null;
      return slRow((await q('SELECT * FROM shortlist_items WHERE agency_id = $1 AND id = $2', [agencyId, id])).rows[0]);
    },
    async update(agencyId, id, patch) {
      if (typeof agencyId !== 'string' || typeof id !== 'string') return null;
      const sets = [];
      const vals = [agencyId, id];
      for (const [k, col] of Object.entries(SL_COLUMNS)) {
        if (!(k in patch)) continue;
        let v = patch[k];
        if (k === 'snapshot') v = JSON.stringify(v);
        if (k === 'checkedAt') v = new Date(v);
        vals.push(v);
        sets.push(`${col} = $${vals.length}`);
      }
      if (!sets.length) return shortlists.get(agencyId, id);
      try {
        const { rows } = await q(`UPDATE shortlist_items SET ${sets.join(', ')} WHERE agency_id = $1 AND id = $2 RETURNING *`, vals);
        return slRow(rows[0]);
      } catch (e) {
        if (e.code === UNIQUE_VIOLATION) { const err = new Error('duplicate', { cause: e }); err.code = 'DUPLICATE'; throw err; }
        throw e;
      }
    },
    async delete(agencyId, id) {
      if (typeof agencyId !== 'string' || typeof id !== 'string') return false;
      return (await q('DELETE FROM shortlist_items WHERE agency_id = $1 AND id = $2', [agencyId, id])).rowCount > 0;
    },
    async countForAgency(agencyId) { return (await q('SELECT count(*)::int AS n FROM shortlist_items WHERE agency_id = $1', [agencyId])).rows[0].n; },
    async purgeBefore(date) { return (await q('DELETE FROM shortlist_items WHERE created_at < $1', [new Date(date)])).rowCount; },
  };

  // ---------------------------------------------------------------- Qiymət izləmələri
  const alertRow = (r) => (r ? {
    id: r.id, tokenHash: r.token_hash, route: r.route, mode: r.mode, email: r.email,
    initialPrice: num(r.initial_price), lastPrice: num(r.last_price), lastCheckedAt: iso(r.last_checked_at),
    lastNotifiedAt: iso(r.last_notified_at), createdAt: iso(r.created_at), ipKey: r.ip_key,
  } : null);
  const flightAlerts = {
    kind: 'postgres',
    async insert(a) {
      await q(`INSERT INTO flight_alerts (id, token_hash, route, depart_date, mode, email, initial_price, last_price,
          last_checked_at, last_notified_at, ip_key, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`, [
        a.id, a.tokenHash, JSON.stringify(a.route), a.route.depart, a.mode, a.email, a.initialPrice, a.lastPrice,
        a.lastCheckedAt ? new Date(a.lastCheckedAt) : null, a.lastNotifiedAt ? new Date(a.lastNotifiedAt) : null, a.ipKey, new Date(a.createdAt),
      ]);
      return a;
    },
    async get(id) {
      if (typeof id !== 'string') return null;
      return alertRow((await q('SELECT * FROM flight_alerts WHERE id = $1', [id])).rows[0]);
    },
    async delete(id) { return (await q('DELETE FROM flight_alerts WHERE id = $1', [id])).rowCount > 0; },
    async list() { return (await q('SELECT * FROM flight_alerts ORDER BY created_at')).rows.map(alertRow); },
    async updateMany(items) {
      for (const { id, patch } of items) {
        await q(`UPDATE flight_alerts SET
            last_price = CASE WHEN $2 THEN $3::double precision ELSE last_price END,
            last_checked_at = CASE WHEN $4 THEN $5::timestamptz ELSE last_checked_at END,
            last_notified_at = CASE WHEN $6 THEN $7::timestamptz ELSE last_notified_at END
          WHERE id = $1`, [
          id, 'lastPrice' in patch, patch.lastPrice ?? null,
          'lastCheckedAt' in patch, patch.lastCheckedAt ? new Date(patch.lastCheckedAt) : null,
          'lastNotifiedAt' in patch, patch.lastNotifiedAt ? new Date(patch.lastNotifiedAt) : null,
        ]);
      }
    },
    async countByIpKey(ipKey) { return (await q('SELECT count(*)::int AS n FROM flight_alerts WHERE ip_key = $1', [ipKey])).rows[0].n; },
    async count() { return (await q('SELECT count(*)::int AS n FROM flight_alerts')).rows[0].n; },
    async purgeDepartedBefore(today) { return (await q('DELETE FROM flight_alerts WHERE depart_date < $1::date', [today])).rowCount; },
  };

  // ---------------------------------------------------------------- Avia / avto müraciətləri
  const flightRequests = {
    async insert(r) {
      const { rows } = await q(`INSERT INTO flight_requests (name, phone, email, note, flight_id, offer_id, ip_hash)
        VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, created_at`, [r.name, r.phone, r.email, r.note || '', r.flightId, r.offerId, r.ipHash || null]);
      return { ...r, id: Number(rows[0].id), createdAt: iso(rows[0].created_at) };
    },
    async count() { return (await q('SELECT count(*)::int AS n FROM flight_requests')).rows[0].n; },
    async purgeBefore(date) { return (await q('DELETE FROM flight_requests WHERE created_at < $1', [new Date(date)])).rowCount; },
  };
  const carRequests = {
    async insert(r) {
      const { rows } = await q(`INSERT INTO car_requests (kind, name, phone, note, offer_id, summary, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, created_at`, [r.kind, r.name, r.phone, r.note || '', r.offerId, JSON.stringify(r.summary), r.status || 'new']);
      return { ...r, id: Number(rows[0].id), createdAt: iso(rows[0].created_at) };
    },
    async count() { return (await q('SELECT count(*)::int AS n FROM car_requests')).rows[0].n; },
    async purgeBefore(date) { return (await q('DELETE FROM car_requests WHERE created_at < $1', [new Date(date)])).rowCount; },
  };

  return { kind: 'postgres', pool, accounts, sessions, leads, selections, shortlists, flightAlerts, flightRequests, carRequests, agencySettings, agencyBrand, agencyMarkup, widgets };
}

module.exports = { createRepos };
