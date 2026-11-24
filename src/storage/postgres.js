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
    const l = { id: Number(r.id), type: r.type, name: r.name, phone: r.phone, note: r.note, offerId: r.offer_id, createdAt: iso(r.created_at) };
    if (r.type === 'callback') { l.preferredTime = r.preferred_time; l.context = r.context; }
    if (r.type === 'selection') {
      Object.assign(l, { selectionId: r.selection_id, agencyId: r.agency_id, agency: r.agency_name, manager: r.manager, client: r.client, item: r.item });
    }
    return l;
  };
  const leads = {
    async insert(l) {
      const { rows } = await q(`INSERT INTO leads (type, name, phone, note, offer_id, preferred_time, context,
          selection_id, agency_id, agency_name, manager, client, item, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`, [
        l.type, l.name, l.phone, l.note || '', l.offerId || null, l.preferredTime || null, l.context || null,
        l.selectionId || null, l.agencyId || null, l.agency ?? null, l.manager ?? null, l.client ?? null,
        l.item ? JSON.stringify(l.item) : null, l.createdAt ? new Date(l.createdAt) : new Date(),
      ]);
      return leadRow(rows[0]);
    },
    async listForAgency(agencyId, limit = 200) {
      if (typeof agencyId !== 'string' || !agencyId) return [];
      const { rows } = await q(`SELECT * FROM leads WHERE type = 'selection' AND agency_id = $1
        ORDER BY created_at DESC, id DESC LIMIT $2`, [agencyId, limit]);
      return rows.map(leadRow);
    },
    async count() { return (await q('SELECT count(*)::int AS n FROM leads')).rows[0].n; },
    async purgeBefore(date) { return (await q('DELETE FROM leads WHERE created_at < $1', [new Date(date)])).rowCount; },
  };

  // ---------------------------------------------------------------- Seçim linkləri
  const selRow = (r) => (r ? {
    id: r.id, agencyId: r.agency_id, agency: r.agency_name, manager: r.manager, client: r.client, phone: r.phone,
    message: r.message, currency: r.currency, markup: Number(r.markup), pax: r.pax, items: r.items, createdAt: msOf(r.created_at),
  } : null);
  const selections = {
    async insert(s) {
      await q(`INSERT INTO selections (id, agency_id, agency_name, manager, client, phone, message, currency, markup, pax, items, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`, [
        s.id, s.agencyId, s.agency, s.manager || '', s.client || '', s.phone || '', s.message || '', s.currency, s.markup,
        JSON.stringify(s.pax), JSON.stringify(s.items), new Date(s.createdAt),
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

  return { kind: 'postgres', pool, accounts, sessions, leads, selections, shortlists, flightAlerts, flightRequests, carRequests };
}

module.exports = { createRepos };
